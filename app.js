var request = require('request');
var cheerio = require('cheerio');
var express = require('express');
var app = express();

function parsePage(html, threshold) {
  var $ = cheerio.load(html);
  var posts = [];

  $('div.post').each(function() {
    var post = {};

    var votesCount = $(this).find('.vote_result').text();
    votesCount = parseInt(votesCount, 10);

    if (votesCount > threshold) {
      post.votesCount = votesCount;

      post.title = $(this).find('h3').text().trim();

      post.externalLink = $(this).find('h3 a').attr('href');
      post.commentsLink = $(this).find('.b-post_comments_links a').attr('href');

      post.body = $(this).find('.post_body').html();
      if (post.body !== null) {
        post.body = post.body.trim();
      }

      posts.push(post);
    }
  });

  return posts;
}

function composeFeed(posts) {
  var items = [];
  posts.forEach(function(post) {
    items.push(
      '<item>' +
      '<title>' + post.title + '</title>' +
      '<description>' + post.body + '</description>' +
      '<link>' + post.commentsLink + '</link>' +
      '<guid>' + post.commentsLink + '</guid>' +
      '<pubDate>Mon, 06 Sep 2013 16:20:00 +0000</pubDate>' +
      '</item>'
    );
  });
  return '<?xml version="1.0" encoding="UTF-8" ?>\n' +
    '<rss version="2.0"><channel>' +
    '<title>RSS Title</title>' +
    '<description>RSS feed</description>' +
    '<link>http://d3.ru/</link>' +
    '<lastBuildDate>Mon, 06 Sep 2013 00:01:00 +0000 </lastBuildDate>' +
    '<pubDate>Mon, 06 Sep 2013 16:20:00 +0000 </pubDate>' +
    '<ttl>3600</ttl>' +
    items.join('') +
    '</channel>' +
    '</rss>';
}

function sendFeed(res, posts) {
  var feed = composeFeed(posts);
  res.setHeader('Content-Type', 'application/rss+xml');
  res.send(feed);
}

app.get('/', function(req, res) {
  res.send('d3feed');
});

app.get('/over/:threshold([0-9]+)', function(req, res) {
  var threshold = parseInt(req.params.threshold, 10);
  console.log('Get posts with threshold ' + threshold + ': start...');

  request('http://d3.ru/', function(err, response, body) {
    var posts = parsePage(body, threshold);
    console.log('Get posts with threshold ' + threshold + ': done.');
    sendFeed(res, posts);
  });
});

app.listen(3013);
