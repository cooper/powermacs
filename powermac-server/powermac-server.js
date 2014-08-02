#!/usr/bin/node

var fs          = require("fs"),
    http        = require("http"),
    whiskers    = require("whiskers"),
    server      = http.createServer(handler),
    template    = fs.readFileSync("template.tpl"),
    lastCreate  = new Date();
    context     = {};
    
process.chdir('/home/powermacs');

context = createContext();
console.log('Total memory: ' + context.memory);
console.log('Total speed:  '  + context.speed);
server.listen(8080);
var serve = require("serve-static")('.');
console.log("Server started");

function handler (request, response) {

    // main page.
    if (request.url == '/') {
        response.writeHead(200, { "Content-Type": "text/html" });
        
        // it's been a while.
        var date = new Date();
        if (date.getTime() - lastCreate.getTime() > 30) {
            createContext();
            lastCreate = date;
        }
        
        var html = whiskers.render(template, context);
        response.write(html);
        response.end();
        return;
    }
    
    // other resource.
    serve(request, response, function (err) {
        response.end();
    });
    
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
        
        // OS file.
        var os = macdir + '/os';
        os = fs.existsSync(os) ? fs.readFileSync(os) : 'Unknown';

        // icon file.
        var icon = macdir + '/icon';
        icon = fs.existsSync(icon) ? fs.readFileSync(icon) : 'generic.png';
        
        // check the time.
        var offline = false;
        var time = macdir + '/last_screenshot';
        time = fs.existsSync(time) ? fs.readFileSync(time) : 0;
        if ((Date.now() / 1000) - time > 300) offline = true;
        
        // make the name prettier.
        var name  = macdir;
        var match = name.match(/^.*Power-Mac-(.+)\.local$/i);
        if (match) name = match[1].split('-').join(' ');
        
        macs.push({
            dir:        macdir,
            date:       fs.readFileSync(macdir + '/last_screenshot'),
            hw:         hardware,
            icon:       icon,
            name:       name,
            os:         os,
            memory:     memory,
            speed:      speed,
            offline:    offline
        });
        
        totalMemory += memory;
        totalSpeed  += speed * numberOfCPUs;
    });
    
    var prettyMemory;
    if (totalMemory > 1024) prettyMemory = (totalMemory / 1024) + ' GB';
    else prettyMemory = totalMemory + ' MB';
    
    var prettySpeed;
    if (totalSpeed > 1000) prettySpeed = (totalSpeed / 1000) + ' GHz';
    else prettySpeed = totalSpeed + ' MHz';
    
    return {
        macs:       macs,
        macCount:   macs.length,
        memory:     prettyMemory,
        speed:      prettySpeed
    };
}
