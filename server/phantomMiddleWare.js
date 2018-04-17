var express = require('express');
var app = express();

app.use(function (req, res, next) {
    var content = '';
    var url = req.protocol + '://' + req.get('host') + req.originalUrl;
    var phantom = require('child_process').spawn('phantomjs', ['phantom-server.js', url]);
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