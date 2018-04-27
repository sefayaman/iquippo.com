var express = require('express');
var app = express();

// add sript path for development
var sriptPath = 'server/phantom-server.js';

if(process.env.NODE_EN === 'production')
    sriptPath = 'dist/server/phantom-server.js';

app.use(function (req, res, next) {
    var content = '';
    var url = req.protocol + '://' + req.get('host') + req.originalUrl;
    var phantom = require('child_process').spawn('phantomjs', [sriptPath, url]);
    phantom.stdout.setEncoding('utf8');
    phantom.stdout.on('data', function(data) {
        content += data.toString();
    });
    phantom.on('exit', function(status_code) {
        if (status_code !== 0) {
            console.log('error');
        } else {
            res.send(content);
        }
    });
});

app.listen(8888);