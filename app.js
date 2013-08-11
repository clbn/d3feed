var request = require('request');
var cheerio = require('cheerio');
var express = require('express');
var consolidate = require('consolidate');
var swig = require('swig');
var path = require('path');

var app = express();
app.engine('html', consolidate.swig);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(express.compress());
app.use(express.static(path.join(__dirname, 'public')));

function parsePage(html, threshold) {
  var $ = cheerio.load(html);
  var posts = [];

  $('div.post').each(function() {
    var post = {};

    var votesCount = $(this).find('.vote_result').text();
    votesCount = parseInt(votesCount, 10);

    if (votesCount > threshold) {
      post.votesCount = votesCount;

      var timestamp = $(this).find('.js-date').attr('data-epoch_date');
      timestamp = parseInt(timestamp, 10);
      var date = new Date(timestamp * 1000);
      post.pubDate = date.toUTCString();

      post.title = $(this).find('h3').text().trim();

      post.externalLink = $(this).find('h3 a').attr('href');
      post.commentsLink = $(this).find('.b-post_comments_links a').attr('href');

      post.body = $(this).find('.post_body').html();
      if (post.body !== null) {
        post.body = post.body.replace(/<iframe[^>]+src="http:\/\/www\.youtube\.com\/embed\/(\w+)["\?][^<]+<\/iframe>/, '<a href="http://www.youtube.com/watch?v=$1"><img src="http://img.youtube.com/vi/$1/0.jpg"/></a>');
        post.body = post.body.trim();
      }

      posts.push(post);
    }
  });

  return posts;
}

function composeFeed(posts, threshold) {
  var items = [];
  posts.forEach(function(post) {
    items.push(
      '<item>' +
      '<title>' + post.title + '</title>' +
      '<description><![CDATA[' + post.body + ']]></description>' +
      '<link>' + post.commentsLink + '</link>' +
      '<guid>' + post.commentsLink + '</guid>' +
      '<pubDate>' + post.pubDate + '</pubDate>' +
      '</item>'
    );
  });

  var date = new Date();
  var pubDate = date.toUTCString();

  return '<?xml version="1.0" encoding="UTF-8" ?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>' +
    '<atom:link href="http://d3feed.ru/over/' + threshold + '" rel="self" type="application/rss+xml" />' +
    '<title>d3.ru — посты с рейтингом выше ' + threshold + '</title>' +
    '<description>80 лет в интернете</description>' +
    '<link>http://d3.ru/</link>' +
    '<lastBuildDate>' + pubDate + '</lastBuildDate>' +
    '<pubDate>' + pubDate + '</pubDate>' +
    '<ttl>3600</ttl>' +
    items.join('') +
    '</channel>' +
    '</rss>';
}

function sendFeed(res, posts, threshold) {
  var feed = composeFeed(posts, threshold);
  res.setHeader('Content-Type', 'application/rss+xml');
  res.send(feed);
}

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/over/:threshold([0-9]+)', function(req, res) {
  var threshold = parseInt(req.params.threshold, 10);
  console.log('Get posts with threshold ' + threshold + ': start...');

  request('http://d3.ru/', function(err, response, body) {
    var posts = parsePage(body, threshold);
    console.log('Get posts with threshold ' + threshold + ': done.');
    sendFeed(res, posts, threshold);
  });
});

app.listen(3013);
