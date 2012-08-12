var express = require('express');
var app = express();

var http = require('http');

function filterFeed(feed) {
  // TODO filtering
  return feed;
}

app.get('/', function(req, res) {
  res.send('d3feed');
});

app.get('/over/:num([0-9]+)', function(req, res) {
  var options = {
    host: 'dirty.ru',
    port: 80,
    path: '/rss_7.xml'
  };

  http.get(options, function(innerRes) {
    var buffer = [];
    var bodyLength = 0;

    innerRes.on('data', function(chunk) {
      buffer.push(chunk);
      bodyLength += chunk.length;
    });

    innerRes.on('end', function() {
      var body;
      if (buffer.length && Buffer.isBuffer(buffer[0])) {
        body = new Buffer(bodyLength);
        var offset = 0;
        buffer.forEach(function (chunk) {
          chunk.copy(body, offset, 0, chunk.length);
          offset += chunk.length;
        });
        body = body.toString();
      } else if (buffer.length) {
        body = buffer.join('');
      }

      body = filterFeed(body);

      res.header('Content-Type', 'text/xml; charset=utf-8');
      res.write(body);
      res.end();
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
});

app.listen(3000);
