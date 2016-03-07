var http = require('http');
var requestHelper = require('request');
var express = require('express');
var app = express();
var url = require('url');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/auth', function(request, response) {
  var url_parts = url.parse(request.url, true);
  if (request.query.code) {
     getKey(request.query.code)
  }
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

function getKey(code) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
  }

  var options = {
    method: 'GET',
    url: 'https://slack.com/api/oauth.access',
    headers: headers,
    qs: {
      'client_id': '24999931810.25003305249',
      'client_secret': '2ef373aad7fac39fdb54aceeae307039',
      'code': code,
      'redirect_uri': 'https://intense-springs-30435.herokuapp.com/auth'
    }
  }

  requestHelper(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // Print out the response body
      console.log(body)
    }
  })
}
