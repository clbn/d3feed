var express = require('express');
var app = express();

var http = require('http');

app.get('/', function(req, res) {
  res.send('d3feed');
});

app.get('/over/:num([0-9]+)', function(req, res) {

  res.header('Content-Type', 'text/xml; charset=utf-8');

  var options = {
    host: 'dirty.ru',
    port: 80,
    path: '/rss_7.xml'
  };
  http.get(options, function(innerRes) {
    innerRes.on('data', function(chunk) {
      res.write(chunk);
    });
    innerRes.on('end', function() {
      res.end();
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });

});

app.listen(3000);
