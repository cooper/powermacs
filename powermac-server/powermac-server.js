#!/usr/bin/node

var fs          = require("fs"),
    http        = require("http"),
    whiskers    = require("whiskers"),
    server      = http.createServer(handler),
    template    = fs.readFileSync("template.tpl"),
    context     = {};
    
process.chdir('/home/powermacs');
context = createContext();
server.listen(8080);
var serve = require("serve-static")('.');
console.log("Server started");

function handler (request, response) {

    // main page.
    if (request.url == '/') {
        response.writeHead(200, { "Content-Type": "text/html" });
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

    // filter out machine directories.
    directories = fs.readdirSync('.').filter(function (file) {
        return file.match(/\.local$/);
    });
    
    var macs = [];
    directories.forEach(function (macdir) {
    
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
                    value:  items.slice(1)
                };
                hardware.push(pair);
            });
        }
        
        // OS file.
        var os = macdir + '/os';
        os = fs.existsSync(os) ? fs.readFileSync(os) : 'Unknown';

        // icon file.
        var icon = macdir + '/icon';
        icon = fs.existsSync(icon) ? fs.readFileSync(icon) : 'generic.png';
        
        // make the name prettier.
        var name  = macdir;
        var match = name.match(/^.*Power-Mac-(.+)\.local$/i);
        if (match) name = match[1].split('-').join(' ');
        
        macs.push({
            dir:    macdir,
            date:   fs.readFileSync(macdir + '/last_screenshot'),
            hw:     hardware,
            icon:   icon,
            name:   name,
            os:     os
        });
    });
    
    return { macs: macs };
}
