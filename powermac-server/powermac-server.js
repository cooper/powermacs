#!/usr/bin/node

var fs          = require("fs"),
    http        = require("http"),
    whiskers    = require("whiskers"),
    server      = http.createServer(handler),
    template    = fs.readFileSync("template.tpl"),
    lastCreate  = new Date();
    context     = {},
    months      = [
        'January', 'February', 'March', 'April',
        'May', 'June','July', 'August', 'September',
        'October', 'November', 'December'
    ];
    
process.chdir('/home/powermacs');

context = createContext();
console.log('Total memory: ' + context.memory);
console.log('Total speed:  '  + context.speed);
server.listen(8080);
var serve = require("serve-static")('.');
var finalhandler = require('finalhandler');
console.log("Server started");

function handler (request, response) {

    // main page.
    if (request.url == '/') {
        response.writeHead(200, { "Content-Type": "text/html" });
        
        // it's been a while.
        var date = new Date();
        if (date.getTime() - lastCreate.getTime() > 30000) {
            context = createContext();
            lastCreate = date;
        }
        
        var html = whiskers.render(template, context);
        response.write(html);
        response.end();
        return;
    }
    
    // other resource.
    var done = finalhandler(request, response);
    serve(request, response, done);
    
}

function createContext () {
    var totalMemory = 0, totalSpeed = 0;
    
    // filter out machine directories.
    directories = fs.readdirSync('.').filter(function (file) {
        return file.match(/\.local$/);
    });
    
    var macs = [];
    directories.forEach(function (macdir) {
        var memory = 0, speed = 0, numberOfCPUs = 1;
        
        // hardware file: split it into key:value pairs.
        var hardwareFile = macdir + '/hardware_info', hardware = [];
        if (fs.existsSync(hardwareFile)) {
            hardwareFile = new String(fs.readFileSync(hardwareFile));
            var lines = hardwareFile.split('\n');
            lines.forEach(function (line) {
                var items = line.split(':');
                if (typeof items == 'undefined') return;
                var pair = {
                    key:    items[0],
                    value:  items.slice(1).join(':').trim()
                };
                
                // parse the memory into megabytes.
                if (pair.key == 'Memory') {
                    var parts  = String(pair.value).split(' ');
                    memory     = Number(parts[0]);
                    var suffix = parts[1];
                    if (suffix == 'GB') memory *= 1024;
                }
                
                // parse CPU speed into megahertz.
                if (pair.key.match(/(cpu|processor) speed/i)) {
                    var parts  = String(pair.value).split(' ');
                    speed      = Number(parts[0]);
                    var suffix = parts[1];
                    if (suffix == 'GHz') speed *= 1000;
                }
                
                if (pair.key == 'Number Of CPUs')
                    numberOfCPUs = pair.value;
                
                hardware.push(pair);
            });
            
        }
        var speedTimesCPUs = speed * numberOfCPUs;
        
        // OS file.
        var os = macdir + '/os';
        os = fs.existsSync(os) ? fs.readFileSync(os) : 'Unknown';

        // icon file.
        var icon = macdir + '/icon';
        icon = fs.existsSync(icon) ? fs.readFileSync(icon) : 'generic.png';
        
        // check the time.
        var offline = false;
        var last = macdir + '/last_screenshot';
        last = fs.existsSync(last) ? fs.readFileSync(last) : 0;
        if ((Date.now() / 1000) - last > 300) offline = true;
        
        // make the name prettier.
        var name  = macdir;
        var match = name.match(/^.*Power-Mac-(.+)\.local$/i);
        if (match) name = match[1].split('-').join(' ');
        
        // format dates.
        var d    = new Date(last * 1000);
        var date = months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
        var time = d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2);
        
        macs.push({
            dir:        macdir,
            time:       time,
            date:       date,
            hw:         hardware,
            icon:       icon,
            name:       name,
            os:         os,
            memory:     memory,
            speed:      speed,
            offline:    offline,
            speedx:     speedTimesCPUs
        });
        
        totalMemory += memory;
        totalSpeed  += speedTimesCPUs;
    });

    // format memory.
    var prettyMemory;
    if (totalMemory > 1024) prettyMemory = (totalMemory / 1024) + ' GB';
    else prettyMemory = totalMemory + ' MB';

    // format speed.
    var prettySpeed;
    if (totalSpeed > 1000) prettySpeed = (totalSpeed / 1000) + ' GHz';
    else prettySpeed = totalSpeed + ' MHz';
    
    // sort by CPU; put offline ones at bottom.
    macs.sort(function (mac1, mac2) {
        var num1 = mac1.speedx;
        if (mac1.offline) num1 -= 5000;
        var num2 = mac2.speedx;
        if (mac2.offline) num2 -= 5000;
        return num2 - num1;
    });
        
    return {
        macs:       macs,
        macCount:   macs.length,
        memory:     prettyMemory,
        speed:      prettySpeed
    };
}
