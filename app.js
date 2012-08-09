var app = require('express').createServer();

app.get('/', function(req, res){
  res.send('d3feed');
});

app.get('/over/:num([0-9]+)', function(req, res){
  res.send('over ' + req.params.num);
});

app.listen(3000);

