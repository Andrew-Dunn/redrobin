// web.js
var express = require("express");
var logfmt = require("logfmt");
var Parse = require('parse').Parse;
var engine = require('./engine');
var jade = require('jade');
var stylus = require('stylus');
var nib = require('nib');

var melbourne  = "-37.777,144.971,50km";
engine.setLocation(melbourne);
var app = express()
function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(stylus.middleware(
  { src: __dirname + '/public'
  , compile: compile
  }
))
app.use(express.static(__dirname + '/public'))
app.use(logfmt.requestLogger());

Parse.initialize("FK3rFd4BfRgX2713I0CMf6R52437IMB00gxtbofB",
	"ZCJOEfbwnCLAI7OyZDl7C8sToGDk7gPIUAIUImJq");

app.get('/', function(req, res) {
	var options = {};
	options["/calc"] = "Get the emotional index for the current day";
	options["/calc/:date"] = "Get the emotional index for the specified day";
	var today = new Date();
	today = today.ymd();
	console.log("Todays Date: "+today);
	engine.getTwitterSentiment(res, today, engine.calculateTwitterSentiment, true);
});

//add a date util
Date.prototype.ymd = function() {         
	var yyyy = this.getFullYear().toString();                                    
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
    var dd  = this.getDate().toString();             
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};  

app.get('/calc', function(req, res) {
	var today = new Date();
	today = today.ymd();
	console.log("Todays Date: "+today);
	engine.getTwitterSentiment(res, today, engine.calculateTwitterSentiment, false);
});


app.get('/calc/:date', function(req, res) {

	var SentimentIndex = Parse.Object.extend("SentimentIndex");
	var sentimentQuery = new Parse.Query(SentimentIndex);

	var dateStamp = req.params.date;
	console.log("Sentiment Index for " + dateStamp + " requested");
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
			    res.contentType('application/json');
			    res.send(JSON.stringify(sentimentInfo));
			}
			else{
				var sentimentIndex = new SentimentIndex();
				engine.calculateTwitterSentiment(res, req.params.date, sentimentIndex, true, false);
			}	
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