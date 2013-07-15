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

app.get('/', function(req, res) {
  res.send('d3feed');
});

app.get('/over/:threshold([0-9]+)', function(req, res) {
  var threshold = parseInt(req.params.threshold, 10);
  console.log('Get posts with threshold ' + threshold + ': start...');

  request('http://d3.ru/', function(err, response, body) {
    var posts = parsePage(body, threshold);
    console.log('Get posts with threshold ' + threshold + ': done.');
    res.send(JSON.stringify(posts));
  });
});

app.listen(3013);
