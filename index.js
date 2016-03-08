var http = require('http');
var requestHelper = require('request');
var express = require('express');
var app = express();
var url = require('url');

var express        =        require("express");
var bodyParser     =        require("body-parser");
var app            =        express();

var ACCESS_TOKEN = "xoxp-24999931810-24999636768-25360127220-4879e4d896";
var BOT_ACCESS_TOKEN = "xoxb-25049965060-BXU8Ua6XPvBIgyD4MbuQLmtc";

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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
      'redirect_uri': 'https://call-me-maybe-rp.herokuapp.com/auth'
    }
  }

  requestHelper(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // Print out the response body
      console.log(body)
    }
  })
}

app.get('/test', function(req, res) {
   var properties = { "default": "this is a default key" };
   console.log("Query Strings: ", req.query)
   for (var property in req.query) {
console.log("Processing ", property);
      if (req.query.hasOwnProperty(property)) {
         // do stuff
console.log("Adding ", property);
         properties[property] = req.query[property];
      } else {
console.log("Skipping ", property);
      }
   }

   res.json(properties);
});


app.post('/roulette',function(req,res){
  var request=JSON.stringify(req.body);
  console.log("request = "+request);

 var request = require('request');
// var propertiesObject = { token:'xoxb-25049965060-ki7nRZf2ROLLT4zOqo9qwM0U', channel:req.body.channel_id };

// request({url:"https://slack.com/api/channels.info", qs:propertiesObject}, function(err, response, body) {
//  if(err) { console.log(err); return; }
//  
//  console.log("/roulette text: " + req.body.text)
//  console.log("Get response: " + response);
//  console.log("Get body: " + body);
//  var bodyJson = JSON.parse(body);
//  console.log("Get Channel:" + bodyJson.channel);
//  console.log("Get Members: " + bodyJson.channel.members);
//  var memberArray = bodyJson.channel.members
// 
//  var rand = memberArray[Math.floor(Math.random() * memberArray.length)];
//  console.log("random Member id: ", rand);
 	
   var userGroupObject = { token:ACCESS_TOKEN };
   request({url:"https://slack.com/api/usergroups.list", qs:userGroupObject}, function(err, response, body) {
      var convertedBody = JSON.parse(body);
      console.log("converted body: " + JSON.stringify(convertedBody));
      console.log("usergroups: " + JSON.stringify(convertedBody["usergroups"]));
      var usergroups = convertedBody["usergroups"];
      for (var i = 0; i < usergroups.length; i++) {
         var group = usergroups[i];
         console.log("Comparing " + req.body.text + " to " + group["handle"]);
         if (req.body.text == group.handle) {
            console.log("The magic ID is: " + group.id);
            var blah = { token:ACCESS_TOKEN, usergroup:group.id };
            request({url:"https://slack.com/api/usergroups.users.list", qs:blah}, function(err, response, body) {
               var users = JSON.parse(body)["users"];
               var rand = users[Math.floor(Math.random() * users.length)];
               console.log("random Member id: ", rand);
               
               var userInfo = { token:ACCESS_TOKEN, user:rand };
               request({url:"https://slack.com/api/users.info", qs:userInfo}, function(err, response, body) {
                  var user = JSON.parse(body)["user"];
                  var userName = user["name"];
                  console.log("User Name: ", userName);
                  res.end(userName + " has been chosen");
               });
            });
         } else {
            console.log("You suck!");
         } 
      }
   })
 
//}) 

  //res.end("yes");
});

