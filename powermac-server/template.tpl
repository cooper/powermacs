<!DOCTYPE html>
<html>
<head>
<title>{macCount} Power Macs</title>
<style type="text/css">

* {
    margin: 0;
    padding: 0;
}

body {
    background-color: #eee;
}

#container {
    width: 1000px;
    margin: 50px auto;
    font-family: sans-serif;
}

div.mac-container {
    margin: 50px 0;
    border: 5px solid #333;
    width: 990px;
    background-color: #333;
}

div.screenshot-container {
    position: relative;
    border-top: 5px solid #3CB371;
}

div.screenshot-container.offline {
    border-top: 5px solid #CD5C5C;
}

div.screenshot-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
}

div.last-seen {
    position: absolute;
    top: 40%;
    left: 320px;
    width: 350px;
    height: 100px;
    font-size: 30px;
    line-height: 50px;
    text-align: center;
    color: #fff;
    padding: 10px 0;
    background-color: #333; /*rgba(51, 51, 51, 0.8);*/
    border: 5px solid #CD5C5C;
}

img.screenshot {
    max-width: 100%;
    display: block;
}

div.header {
    background-color: #333;
    color: #fff;
    padding: 20px;
    overflow: hidden;
    height: 150px;
}

div.header a       { color: #fff;    }
div.header a:hover { color: #3CB371; }

div.header h1 {
    margin: 0 20px;
    display: inline-block;
    width: 500px;
    height: 150px;
    font-size: 50px;
    line-height: 75px;
}

div.header div.icon {
    float: left;
    width: 150px;
    height: 150px;
    position: relative;
}

div.header div.icon span {
    position: absolute;
    bottom: 30px;
    left: 0px;
    width: 100%;
    text-align: center;
    color: #777;
    text-shadow: 0 0 2px #777;
}

div.header table {
    width: 250px;
    float: right;
    font-size: 12px;
    border-collapse: collapse;
}

div.header table tr       { height: 15px;           }
div.header table td.key   { font-weight: bold;      }
div.header table td.value { font-family: monospace; }

a {
    color: #3CB371;
    text-decoration: none;
}

a:hover {
    color: green;
}

div.box-container {
    background-color: #333;
    color: white;
    position: relative;
}

div.box-bar {
    width: 100%;
    background-color: #3CB371;
    position: absolute;
    bottom: 0;
    left: 0;
    height: 40px;
    z-index: 1;
}

div.box {
    width: 200px;
    height: 120px;
    font-size: 40px;
    overflow: hidden;
    float: left;
    position: relative;
    text-align: center;
    line-height: 80px;
    margin: 0 65px;
}

div.box div {
    width: 180px;
    font-size: 20px;
    height: 20px;
    line-height: 20px;
    padding: 10px;
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 2;
}

</style>
<script type="text/javascript" src="web/scale/mootools.js"></script>
<script type="text/javascript">
    var screenshots = [];
    var howOften    = 5000;
    document.addEvent('domready', function () {
        screenshots = $$('img.screenshot');
        var timeBetween = howOften / screenshots.length;
        var x = 0;
        screenshots.each(function (img) {
            setTimeout(function () {
                setInterval(function () { reloadImage(img); }, howOften);
            }, x);
            x += timeBetween;
        });
    })
    
    function reloadImage (img) {
        var time = new Date().getTime();
        var real = img.retrieve('real-src');
        if (!real) {
            img.store('real-src', img.getAttribute('src'));
            real = img.retrieve('real-src');
        }
        img.setAttribute('src', real + '?time=' + time);
    }
</script>
</head>
<body>
<div id="container">

<div class="box-container">
    <div class="box">{macCount}<div>Macs</div></div>
    <div class="box">{speed}<div>CPU</div></div>
    <div class="box">{memory}<div>RAM</div></div>
    <div style="clear: both;"></div>
    <div class="box-bar"></div>
</div>

{for mac in macs}
<div class="mac-container">
    <div class="header">
        <table>
            {for row in mac.hw}
            <tr>
                <td class="key">{row.key}</td>
                <td class="value">{row.value}</td>
            </tr>
            {/for}
        </table>
        <div class="icon">
            <img style="height: 100%;" src="icons/{mac.icon}" alt="icon" />
            <span>{mac.os}</span>
        </div>
        <h1>
            Power Mac<br />
            <a style="font-weight: normal;" href="http://{mac.dir}.comcast.rlygd.net">{mac.name}</a>
        </h1>
    </div>
    {if mac.offline}
        <div class="screenshot-container offline">
        <img src="{mac.dir}/screenshot.jpg" alt="{mac.dir}" class="screenshot offline" />
        <div class="screenshot-overlay"></div>
        <div class="last-seen">Last seen {mac.time}<br />{mac.date}</div>
    {else}
        <div class="screenshot-container">
        <img src="{mac.dir}/screenshot.jpg" alt="{mac.dir}" class="screenshot" />
    {/if}
    </div>
</div>
{/for}

<div style="text-align: center; margin: 50px;">
    <img src="web/scale/made_on_a_mac.png" alt="Made on a Mac" /><br />
    <a href="http://nodejs.org" style="color: #bbb; font-size: 12px;">#webscale</a>
</div>
</div>
</body>
</html>
