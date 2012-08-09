var app = require('express').createServer();

app.get('/', function(req, res){
  res.send('d3feed');
});

app.listen(3000);

