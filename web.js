// web.js
var express = require("express");
var logfmt = require("logfmt");
var twitter = require("mtwitter");
if (process.env.REDISTOGO_URL) {
    //redistogo connection
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    var redis = require("redis").createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
} else {
	var redis = require("redis").createClient();
}

var app = express();
app.use(logfmt.requestLogger());

mTwit = new twitter({
	consumer_key: 'RG7hca16EGx7OtAQ8JXRfJ5I8',
	consumer_secret: 'f8xIE16p4ol2AZhxGwITV3rdtQ1l2JifGOV1IhDs6zwRJJlV19',
	access_token_key: '635348000-17rt0Ycpij1s20Zf9QWN9ASBgf5YK4O6zl9fl4I8',
	access_token_secret: 'tmfQCg6NxC7JnnpLdh6H1vqb63dUos6xk00jS5zjY6sRX'
});

app.get('/', function(req, res) {

	mTwit.get('search/tweets',
	{	
		q: "i feel", 
		geocode: "-37.777,144.971,50km",
		count: "5",
		result_type:"recent"

	},
	function(err, item) {
		var map = item.statuses.map(function(status){
			var id = status["id_str"];
			var text = status["text"];
			return  { id : id, text: text } ;
		});
		console.log(map);
		res.send(map);
	});

});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
	console.log("Listening on " + port);
});