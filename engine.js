
var Twitter = require("mtwitter");
var sentiment = require('sentiment');
var Parse = require('parse').Parse;
var location = "";
twitter = new Twitter({
	consumer_key: 'RG7hca16EGx7OtAQ8JXRfJ5I8',
	consumer_secret: 'f8xIE16p4ol2AZhxGwITV3rdtQ1l2JifGOV1IhDs6zwRJJlV19',
	access_token_key: '635348000-17rt0Ycpij1s20Zf9QWN9ASBgf5YK4O6zl9fl4I8',
	access_token_secret: 'tmfQCg6NxC7JnnpLdh6H1vqb63dUos6xk00jS5zjY6sRX'
});

function setLocation(loc){
	location = loc;
}

function getExistingSentimentData(res, day, callback, pretty){

	// Create the Parse object.
	var SentimentIndex = Parse.Object.extend("SentimentIndex");
	var sentimentIndex = new SentimentIndex();
	var saveRequired = true;

	//query to see if todays index has already been calculated
	var sentimentQuery = new Parse.Query(SentimentIndex);
	sentimentQuery.equalTo("day", day);
	sentimentQuery.include("objectId");
	sentimentQuery.find({
		success: function(existingEntry) {
			
			if(existingEntry && existingEntry.length > 0){
				console.log("EXISTING DAY IN PARSE: " + existingEntry[0]["id"]);
				sentimentQuery.get(existingEntry[0]["id"], {
					success: function(existingIndex) {
						sentimentIndex = existingEntry[0];
						saveRequired = false;
					},
					error: function(object, error) {
						res.send(JSON.stringify(error));
					}
				});
			}else{
				sentimentIndex.set("day", day);
			}
			callback(res, day, sentimentIndex, saveRequired, pretty);
		},
		error: function(error) {
			console.log("Error: " + error.code + " " + error.message);
			res.send("Error: " + error.code + " " + error.message);
		}
	});
}

function getDaysRecentTweetSentiment(res, day, sentimentIndex, saveRequired, pretty){
		//scrape twitter data, take a sample, and map reduce the values into a sentiment index.
		twitter.get('search/tweets',
		{	
			q: "", 
			geocode: location,
			count: "100",
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
		
		if(saveRequired){
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
					var doRender = function doRender() {
						res.render('index',
							{ index : sum,
								date:   day,
								tweets: sample["tweets"] });
					};

		   		if(pretty){
						// Make the tweets pretty
						var sampleCount = sample.tweets.length;
						var left = sampleCount;
						for (var i = 0; i < sampleCount; i++) {
							var index = {'index': i};
							twitter.get('statuses/oembed',
							{
								id: sample.tweets[i].id
							},
							(function(err, item) {
								if (err) {
									console.warn("Unable to retrieve embedded tweet: "+err);
									console.log(item);
								} else {
									sample.tweets[this.index].html = item.html;
								}

								if (--left == 0)
								{
									doRender();
								}
								return;
							}).bind(index));
						}
		   		}else{
		   			sample["sentimentIndex"] = sum;
		   			res.contentType('application/json');
		   			res.send(JSON.stringify(sample));	
		   		}
		   	},
		   	error: function(result, error) {
		   		res<Down>send(JSON.stringify(error));
		   	}
		   });
	});
}

exports.calculateTwitterSentiment = getDaysRecentTweetSentiment;
exports.getTwitterSentiment = getExistingSentimentData;
exports.setLocation = setLocation;
