#!/usr/bin/perl

use warnings;
use strict;
use 5.008;

use Sys::Hostname;
use Data::Dumper 'Dumper';
use File::Copy   'copy';

my $last_command_check = 0;
my $sleep = 1;
my $me = hostname;

sub say (@) { print @_, "\n" }

until (
    chdir '/Volumes/powermacs'   &&
    (-e $me || mkdir $me)      
) {
    sleep $sleep;
}

tie my $commands,               __PACKAGE__, 'commands',                '';
tie my $screenshot_interval,    __PACKAGE__, 'screenshot_interval',     0;
tie my $last_screenshot,        __PACKAGE__, "$me/last_screenshot",     0;
tie my $done,                   __PACKAGE__, "$me/commands_done",       {};
tie my $last_start,             __PACKAGE__, "$me/last_start",          0;
tie my $hardware_info,          __PACKAGE__, "$me/hardware_info",       0;
tie my $os_version,             __PACKAGE__, "$me/os",                  'Unknown';

my %done = %{ eval $done || {} };
$last_start = time;

say "Started at ", scalar localtime $last_start;
$hardware_info = get_hardware_info();
$os_version    = trim_end(`sw_vers -productVersion`);

while (1) {
    say "Not connected" and next unless -e 'connected';
    
    # the script has changed; reload it.
    if ($^T < (stat($0))[9]) {
        say "Script has changed; calling exec()";
        say;
        exec 'perl', __FILE__;
        exit;
    }
    
    # check if new commands should be executed.
    if (time - $last_command_check >= 30 && $commands) {
        foreach my $line (split /\n/, $commands) {
            defined $line or next;
            my ($id, $command) = split / /, $line, 2;
            next if $done{$id};
            system $command;
            $done{$id} = 1;
            $done = Dumper \%done;
        }
        $last_command_check = time;
    }
    
    # update screenshot.
    if ($screenshot_interval && time - $last_screenshot >= $screenshot_interval) {
        say "Updating screenshot";
        # use -Cx if you want the cursor
        system "screencapture -x -tjpg $me/screenshot-large.jpg";
        system "sips --resampleWidth 1000 --setProperty formatOptions 60% " .
               "$me/screenshot-large.jpg --out $me/screenshot-small.jpg";
        copy("$me/screenshot-small.jpg", "$me/screenshot.jpg");
        $last_screenshot = time;
    }
    
    sleep $sleep;
}

sub get_hardware_info {
    my @lines = split /\n/, `system_profiler -detailLevel mini SPHardwareDataType`;
    my @good;
    foreach (@lines) {
        s/^\s+//g;
        s/\s+$//g;
        next unless length;
        next if /^Hardware/;
        push @good, $_;
    }
    return join "\n", @good;
}

#################
### Tie magic ###
#################

sub TIESCALAR {
    my ($class, $file, $default) = @_;
    return bless {
        file      => $file,
        last_time => 0,
        default   => $default
    }, $class;
}

sub FETCH {
    my $tie = shift;
    my $modified = (stat($tie->{file}))[9] || 0;

    # not modified.
    return defined $tie->{content} ? $tie->{content} : $tie->{default}
      if $modified <= $tie->{last_time};
    
    # can't open; use default.
    if (!$tie->{read_fh}) {
        open $tie->{read_fh}, '<', $tie->{file}
          or say "Reading $$tie{file}: $!" and return $tie->{default};
    }
    my $fh = $tie->{read_fh};
    seek $fh, 0, 0;
    
    # slurp the contents.
    local $/;
    $tie->{content} = trim_end(<$fh>);
    my $pretty_content = defined $tie->{content} ? $tie->{content} : 'file does not exist';
    say "\$$$tie{file} = $pretty_content";
    
    $tie->{last_time} = time;
    return defined $tie->{content} ? $tie->{content} : $tie->{default};
}

sub STORE {
    my ($tie, $value) = @_;
    $value = trim_end($value);
    return if defined $tie->{content} && $value eq $tie->{content};
    if (!$tie->{write_fh}) {
        open $tie->{write_fh}, '>', $tie->{file}
          or say "Writing $$tie{file}: $!" and return;
    }
    my $fh = $tie->{write_fh};
    seek $fh, 0, 0;
    print $fh $value;
    $tie->{content}   = $value;
    $tie->{last_time} = time;
}

sub trim_end {
    my $str = shift;
    return unless defined $str;
    $str =~ s/\s+$//g;
    return $str;
}
