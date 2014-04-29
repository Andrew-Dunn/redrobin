// web.js
var express = require("express");
var logfmt = require("logfmt");
var twitter = require("mtwitter");
var sentiment = require('sentiment');
var Parse = require('parse').Parse;
var app = express();
app.use(logfmt.requestLogger());

mTwit = new twitter({
	consumer_key: 'RG7hca16EGx7OtAQ8JXRfJ5I8',
	consumer_secret: 'f8xIE16p4ol2AZhxGwITV3rdtQ1l2JifGOV1IhDs6zwRJJlV19',
	access_token_key: '635348000-17rt0Ycpij1s20Zf9QWN9ASBgf5YK4O6zl9fl4I8',
	access_token_secret: 'tmfQCg6NxC7JnnpLdh6H1vqb63dUos6xk00jS5zjY6sRX'
});

Parse.initialize("FK3rFd4BfRgX2713I0CMf6R52437IMB00gxtbofB",
	"ZCJOEfbwnCLAI7OyZDl7C8sToGDk7gPIUAIUImJq");

app.get('/', function(req, res) {
	var options = {};
	options["/calc"] = "Get the emotional index for the current day";
	options["/calc/:date"] = "Get the emotional index for the specified day";
	res.send(options);
});

//add a date util
Date.prototype.ymd = function() {         
	var yyyy = this.getFullYear().toString();                                    
        var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
        var dd  = this.getDate().toString();             
        return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
    };  


    app.get('/calc', function(req, res) {

	// Create the Parse object.
	var SentimentIndex = Parse.Object.extend("SentimentIndex");
	var sentimentIndex = new SentimentIndex();
	var alreadyCalculated = false;
	var today = new Date();
	today = today.ymd();
	console.log("Todays Date: "+today);
	//query to see if todays index has already been calculated
	var sentimentQuery = new Parse.Query(SentimentIndex);
	sentimentQuery.equalTo("day", today);
	sentimentQuery.include("objectId");
	sentimentQuery.find({
		success: function(existingEntry) {
			
			if(existingEntry && existingEntry.length > 0){
				console.log("EXISTING DAY IN PARSE: " + existingEntry[0]["id"]);
				sentimentQuery.get(existingEntry[0]["id"], {
					success: function(existingIndex) {
				    	sentimentIndex = existingEntry[0];
				    	alreadyCalculated = true;
				  	},
				  	error: function(object, error) {
				   		res.send(JSON.stringify(error));
				  	}
				});
			}else{
				sentimentIndex.set("day", today);
			}

	//scrape twitter data, take a sample, and map reduce the values into a sentiment index.
	mTwit.get('search/tweets',
	{	
		q: "i feel", 
		geocode: "-37.777,144.971,50km",
		count: "10",
		result_type:"recent"
	},
	function(err, item) {

		if(err){
			console.warn("failed scrape: "+err);
			console.log(item);
			return;	
		}

		//cull the twitter response into simple pairs.
		var tweets = item.statuses.map(function(status){
			return { id : status["id_str"] , text: status["text"] };
		});

		//take a sample of the tweets for the day, 
		var sample = {};
		sample["tweets"] = tweets.slice(0, 4);
		
		if(!alreadyCalculated){
			//save the sample up to Parse
			var sampleCount = sample.tweets.length;
			for (var i = 0; i < sampleCount; i++) {
				var TweetPair = Parse.Object.extend("TweetPair");
				var tweetPair = new TweetPair();
				tweetPair.set("userID", sample["tweets"][i].id);
				tweetPair.set("text", sample["tweets"][i].text);
				tweetPair.save();
				sentimentIndex.add("Pairs", tweetPair);
			}
		}
		var indexes = tweets.map(function(tweet){
			var tweetSentiment = sentiment(tweet["text"]);
			var score = tweetSentiment["score"];
			console.log(score);
			return score;
		});

		var indexCount = indexes.length;
		var sum = 0;
		for (var i = 0; i < indexCount; i++) {
			sum += indexes[i];
		}
		console.log("RAW: "+sum);
		sum = (sum / indexCount);
		console.log("AVG: "+sum);
		sum = ((sum +10)/20)*100;
		console.log("%: "+sum);

		//save the sentiment index to parse
		sentimentIndex.set("sentimentIndex", sum);
		
		sentimentIndex.save(null, {
			success: function(result) {
		   		//add the sentiment to the response json
		   		sample["sentimentIndex"] = sum;
		   		res.contentType('application/json');
		   		res.send(JSON.stringify(sample));
   			},
   			error: function(result, error) {
   				res.send(JSON.stringify(error));
   			}
   		});
   });

//
},
		error: function(error) {
			console.log("Error: " + error.code + " " + error.message);
			res.send("Error: " + error.code + " " + error.message);
		}
	});

	//
});

app.get('/calc/:date', function(req, res) {

	var SentimentIndex = Parse.Object.extend("SentimentIndex");
	var sentimentQuery = new Parse.Query(SentimentIndex);

	var dateStamp = req.params.date;
	console.log("Sentiment Index for" + dateStamp + "requested");
	sentimentQuery.equalTo("day", req.params.date );
	sentimentQuery.include("Pairs");
	sentimentQuery.find({
		success: function(results) {
			
			var sentimentInfo = {};
			if(results.length > 0){

				console.log("Successfully retrieved " + results.length + " item");
			    //assume single result.
			    var data = results[0];
			    var pairs = data.get("Pairs");
			    var arr = new Array();
			    for (var i = 0; i < pairs.length; i++) { 
			    	arr[i] = { id: pairs[i].get("userID"), text: pairs[i].get("text")};
			    }			    
			    sentimentInfo["tweets"] = arr;
			    sentimentInfo["sentimentIndex"] = data.get("sentimentIndex");
			}

			res.contentType('application/json');
			res.send(JSON.stringify(sentimentInfo));
		},
		error: function(error) {
			console.log("Error: " + error.code + " " + error.message);
			res.send("Error: " + error.code + " " + error.message);
		}
	});
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
	console.log("Listening on " + port);
});