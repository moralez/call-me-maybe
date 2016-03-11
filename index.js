var http          = require('http');
var rtg           = require("url").parse(process.env.REDISTOGO_URL);
var client        = require("redis").createClient(rtg.port, rtg.hostname);
var requestHelper = require('request');
var express       = require('express');
var app           = express();
var url           = require('url');
var bodyParser    = require("body-parser");
var RtmClient     = require('@slack/client').RtmClient;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS    = require('@slack/client').RTM_EVENTS;

var rtm;
var listings;
var zipCode;
var totalPages;
var currentPage;
var requestID;

client.auth(rtg.auth.split(":")[1]);

var ACCESS_TOKEN = "";
var BOT_ACCESS_TOKEN = "";
var LAST_SEARCH_ID = "";

var emojis = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "arrow_right"];

client.get("ACCESS_TOKEN", function(err, reply) {
    // reply is null when the key is missing
    console.log("Before " + reply);
    ACCESS_TOKEN = reply;
 });
console.log("ACCESS_TOKEN Set: " + ACCESS_TOKEN);

client.get("BOT_ACCESS_TOKEN", function(err, reply) {
    // reply is null when the key is missing
    console.log("Before " + reply);
    BOT_ACCESS_TOKEN = reply
    if (BOT_ACCESS_TOKEN) {
      rtm = new RtmClient(BOT_ACCESS_TOKEN, {logLevel: 'none'});
      rtm.start();

      rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
         console.log("Reaction added:", reaction);
         var REACTION_ID = reaction.item.channel + ":" + reaction.item.ts;
         var userId = reaction.user;
         var itemUserId = reaction.item_user
         if (REACTION_ID == LAST_SEARCH_ID) {
            console.log("We got a match!");
            var reactionValue = reaction.reaction;
            var contactInformationText = "";
            var option = -1;
            var nextPage = false
            switch (reactionValue) {
               case 'zero':
                  console.log("Behind door number 0");
                  option = 0;
                  break;
               case 'one':
                  console.log("Behind door number 1");
                  option = 1;
                  break;
               case 'two':
                  console.log("Behind door number 2");
                  option = 2;
                  break;
               case 'three':
                  console.log("Behind door number 3");
                  option = 3;
                  break;
               case 'four':
                  console.log("Behind door number 4");
                  option = 4;
                  break;
               case 'five':
                  console.log("Behind door number 5");
                  option = 5;
                  break;
               case 'six':
                  console.log("Behind door number 6");
                  option = 6;
                  break;
               case 'seven':
                  console.log("Behind door number 7");
                  option = 7;
                  break;
               case 'eight':
                  console.log("Behind door number 8");
                  option = 8;
                  break;
               case 'nine':
                  console.log("Behind door number 9");
                  option = 9;
                  break;
                case 'arrow_right': 
                  nextPage = true
                  break;
                default:
                  console.log("Didn't try to open anything");
                  break;
            }

            if (userId != itemUserId) {
               console.log("Not from bot");
               if (option != -1 && nextPage == false) {
                  if(listings[option].mgtconame) {
                    contactInformationText = "Property Management: " + listings[option].mgtconame;
                  }
                  if(listings[option].formatted_mdot_phn) {
                     contactInformationText = contactInformationText + "\nPhone Number: " + listings[option].formatted_mdot_phn;
                  }
                  if(listings[option].seo_path) {
                    contactInformationText = contactInformationText + "\nWeb Page: " + "http://www.qa.apartmentguide.com" + listings[option].seo_path;
                  }

                  var postMessageParams = { token:BOT_ACCESS_TOKEN, channel:reaction.user, text: contactInformationText, as_user: true, parse: "full" };
                  requestHelper({url:"https://slack.com/api/chat.postMessage", qs:postMessageParams}, function(err, response, body) {
                     console.log("Finished sending postMessage");
                  });
               } else if (nextPage) {
                 parseThroughListings(requestID, zipCode, ++currentPage)
               }
            } else {
               console.log("Reaction from bot!");
               addNextReaction(option, reaction.item.channel, reaction.item.ts);
            }
         }
      });
    }
 });
console.log("BOT_ACCESS_TOKEN Set: " + BOT_ACCESS_TOKEN);


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
      console.log("Body: " + body);
      var bodyJson = JSON.parse(body)
      if (bodyJson.hasOwnProperty("error")) {
         console.log("Beth is breaking stuff again....");
      } else {
         console.log("No worries, Johnny fixed it!");
         
         console.log("BodyJSON Tokens " + JSON.stringify(bodyJson));
         

         ACCESS_TOKEN = bodyJson.access_token;
         BOT_ACCESS_TOKEN = bodyJson.bot.bot_access_token;
         console.log("AFTER - ACCESS_TOKEN: " + ACCESS_TOKEN + " " + "\nBOT_ACCESS_TOKEN: " + BOT_ACCESS_TOKEN)
         client.set("ACCESS_TOKEN", ACCESS_TOKEN, redis.print);
         client.set("BOT_ACCESS_TOKEN", BOT_ACCESS_TOKEN, redis.print);
      }
      
      console.log("Response: " + response);
   }
})
}

// app.get('/test', function(req, res) {
//    var properties = { "default": "this is a default key" };
//    console.log("Query Strings: ", req.query)
//    for (var property in req.query) {
// console.log("Processing ", property);
//       if (req.query.hasOwnProperty(property)) {
//          // do stuff
// console.log("Adding ", property);
//          properties[property] = req.query[property];
//       } else {
// console.log("Skipping ", property);
//       }
//    }
// 
//    res.json(properties);
// });

app.get('/tokens', function(req, res) {
  var tokenString = "";
  client.get("ACCESS_TOKEN", function(err, reply) {
    tokenString += reply.toString();
        console.log(res.toString()); // => should be crazy token
        client.get("BOT_ACCESS_TOKEN", function(err, reply) {
         tokenString += " " + reply.toString();
            console.log(res.toString()); // => should be crazy token
            res.end("Result: " + tokenString);
         });
     });
})

app.post('/checkins', function(req, res) {
   // someone run /checkins
   // this grabs the channel message was sent from
   // gets list of users in the channel
   // gets the recent chat history from 7 AM  to 11 AM
   // checks for messages from those users in that time frame
   // returns lists of who has checked in and who has not
   // console.log("Request Body: " + JSON.stringify(req.body));
   var requestBody = req.body;

   var channelsToCheck = [];

   var userGroupObject = { token:ACCESS_TOKEN };
   requestHelper({url:"https://slack.com/api/usergroups.list", qs:userGroupObject}, function(err, response, body) {
      var convertedBody = JSON.parse(body);

      console.log("converted body: " + JSON.stringify(convertedBody));
      console.log("usergroups: " + JSON.stringify(convertedBody["usergroups"]));

      var usergroups = convertedBody["usergroups"];
      for (var i = 0; i < usergroups.length; i++) {
         var group = usergroups[i];

         console.log("Comparing " + req.body.text + " to " + group["handle"]);

         if (req.body.text == group.handle) {

            channelsToCheck = group.prefs.channels;

            console.log("The magic ID is: " + group.id);

            var blah = { token:ACCESS_TOKEN, usergroup:group.id };
            requestHelper({url:"https://slack.com/api/usergroups.users.list", qs:blah}, function(err, response, body) {
               var users = JSON.parse(body)["users"];

               var checkedInUsers = [];

               for (var i = 0; i < channelsToCheck.length; i++) {
                  var channelHistoryParams = { token:ACCESS_TOKEN, channel:channelsToCheck[i] };
                  requestHelper({url:"https://slack.com/api/channels.history", qs:channelHistoryParams}, function(err, response, body) {
                     var messages = JSON.parse(body)["messages"];
                     for (var message in messages) {
                        var userId = message.user;

                        if (checkedInUsers.indexOf(userId) == -1) {
                         checkedInUsers.push(userId);
                       }
                     }

                     var userParams = { token:ACCESS_TOKEN };
                     requestHelper({url:"https://slack.com/api/users.info", qs:userParams}, function(err, response, body) {
                       var userName = JSON.parse(body)["user"].name;
                       var messageText = userName + "has checked in."

                       var messageParams = { token:ACCESS_TOKEN, channel:req.body.user_id, text: messageText};
                       requestHelper({url:"https://slack.com/api/chat.postMessage", qs:userParams}, function(err, response, body) {
                         console.log(userParams);
                         console.log("check in error: " + err)
                         console.log("check in response: " + response)
                         console.log("check in body: " + body);
                       });
                     });

                   });
                }

               res.end("Checked in users: " + checkedInUsers.toString());
            });
         }
      }
   });
});

function parseThroughListings(id, zipCode, page) {
//send zip code to http://m.api.qa.apartmentguide.com/search?query=30092
  var zipCodeObject = { query:zipCode, per_page: 10, page: page};
  var request = require('request');
   request({url:"http://m.api.qa.apartmentguide.com/search", qs:zipCodeObject}, function(err, response, body) {

      var responseBody = JSON.parse(body)
      
      //parse out first 10 listings
      listings = responseBody["listings"]
      console.log("Listings" + listings);
         
      //parse out each of listings' cty, st, baths, beds, adr, photo, prices, name
    
    var messageText = "Here are ten listings at " + zipCode + ":\n\n"
    for(var i = 0; i < listings.length; i++) {
      console.log("i: " + i);
      var index = listings[i]
      var individualListing = determineEmojiForOption(i) + ": " 
      if(index.name) {
        individualListing = individualListing + index.name
      } else {
        individualListing = "This apartment "
      }
      
      individualListing = individualListing + " can be found " 
      if(index.adr) {
        individualListing = individualListing + " at " +  index.adr
      }
      
      if (index.cty || index.st) {
        individualListing = individualListing + " in " + index.cty + ", " + index.st
      }
      
      individualListing = individualListing + "."
      
      if(index.beds) {
        individualListing = individualListing + " " + index.beds + " beds" 
      } 
      
      
      if(index.bhs) {
        individualListing = individualListing + " " + index.baths + " baths" 
      }
            
      if(index.prices) {
        individualListing = individualListing + " available with prices starting at " + index.prices + "."
      }
      
      messageText = messageText + individualListing + "\n";
      console.log("Message Text: " + messageText);
    }
    
    messageText = messageText + "\n\n Please select from options 0 - " + (listings.length - 1) + " for Contact Information on that property.\n\n"
    messageText = messageText + "Please add the reaction :arrow_right: to go the next page of results.";
    
    var postMessageParams = { token:BOT_ACCESS_TOKEN, channel:id, text: messageText, as_user: true, parse: "full" };
      request({url:"https://slack.com/api/chat.postMessage", qs:postMessageParams}, function(err, response, body) {
       console.log("Finished sending postMessage");
         var responseBody = JSON.parse(body)
         LAST_SEARCH_ID = responseBody.channel + ":" + responseBody.message.ts;
         console.log("LAST_SEARCH_ID: " + LAST_SEARCH_ID);
         
         addNextReaction(-1, responseBody.channel, responseBody.message.ts);
      });
   });


}

app.post('/ag', function(req, res){
//given zip code, parse out zip code from request
zipCode = req.body.text
totalPages = req.body.total_pages
currentPage = 1
requestID = req.body.user_id
console.log("User ID: " + req.body.user_id)
console.log("ZipCode: " + zipCode);
console.log("totalPages: " + totalPages);

parseThroughListings(requestID, zipCode, currentPage)
res.end();
});

function addNextReaction(previousIndex, channel, timestamp) {
   console.log("Previous Index: " + previousIndex)
   var newIndex = ++previousIndex;
   console.log("New Index: " + newIndex);
   var reactionParams = { token:BOT_ACCESS_TOKEN, name:emojis[newIndex], channel:channel, timestamp:timestamp };
   requestHelper({url:"https://slack.com/api/reactions.add", qs:reactionParams}, function(err, response, body) {
      console.log("Should have added " + emojis[newIndex] + " reaction");
   });
}

function determineEmojiForOption(index) {
	switch(index) {
    case 0:
        return ":zero:"
    case 1:
    	return ":one:"
    case 2:
    	return ":two:"
	case 3:
    return ":three:"
    	case 4:
    return ":four:"
    	case 5: 
    return ":five:"
    	case 6:
    return ":six:"
    	case 7:
    return ":seven:"
    	case 8:
    return ":eight:"
    default:
    	return ":nine:"
	}
}


app.post('/roulette',function(req,res){
   var request=JSON.stringify(req.body);
   console.log("request = "+request);

   var request = require('request');

   console.log("roulette - ACCESS_TOKEN: " + ACCESS_TOKEN);
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

               var postMessageParams = { token:BOT_ACCESS_TOKEN, channel:req.body.channel_id, text: "Bang! " + userName + " has been chosen", as_user: true };
               request({url:"https://slack.com/api/chat.postMessage", qs:postMessageParams}, function(err, response, body) {
                  console.log("Finished sending postMessage");
                  res.end();
               });
            });
         });
       } else {
         console.log("You suck!");
         if (req.body.text == "") {
            res.end("Please enter the roulette slash command via /roulette slackUserGroupName");
         } else {
            res.end(req.body.text + " does not appear to be a valid usergroup.")
         }
      } 
   }
})
});