// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// setting the port
var port = process.env.PORT || 3000;

// Router
var router = express.Router();

// Redis requirements
var redis = require("redis");
var client = redis.createClient();

// if you'd like to select database 3, instead of 0 (default), call
client.select(1, function() { });
client.on("error", function (err) {
    console.log("Error " + err);
});
client.on("connect", function(){
	// flush all data at start
	//client.flushall();
	
	// set customer serial
	var exists = client.exists('customer_srl'); //returns true if the key exists
	if(!exists) {
	    client.set('customer_srl', 1000);
	};
	
	// set deal serial
	exists = client.exists('deal_srl');
	if(!exists) {
	    client.set('deal_srl', 1000);
	};
	
	// set buy serial
	exists = client.exists('buy_srl');
	if(!exists) {
	    client.set('buy_srl', 0);
	};
});

// test route to make sure everything is working (accessed at GET http://localhost:port)
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/views/index.html');
});
app.get('/registration', function (req, res) {
	console.log("registration button clicked");
	res.sendfile(__dirname + '/views/admin/index.html');
});
app.get('/sales', function (req, res) {
	console.log("Sales button clicked");
	res.sendfile(__dirname + '/views/public/index.html');
});
app.post('/registration/deal', function(req, res){
	console.log(req.body); // debug
	
	client.incr('deal_srl');
	client.get('deal_srl', function (err, result) {
		//console.log(result);
		
		client.hset("deal", result, [
			"title", req.body.title, 
			"desc", req.body.desc, 
			"price", req.body.price, 
			"fee", req.body.fee], 
		redis.print);
	});
	
	res.end('New Deal Registered!');
});
app.post('/deals', function(req, res) {
	client.hgetall("deal", function (err, replies) {
		console.log(err);
		console.log(replies);
		if(err != null)
			res.end("Error occurred while getting data from Redis.");
		else {
			if(replies != null) {
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(replies));
				/*replies.forEach(function (reply, i) {
		    		console.log("    " + i + ": " + reply);
					});*/
		   		//client.quit();
			}
		}
	});
	
});

app.use(express.static(__dirname));
app.use('/', router);
app.listen(port);

console.log('Server is running on http://localhost:' + port);