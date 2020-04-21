
/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

const Configuration = require('../configuration.json');
var express = require('express'); // Express web server framework
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var accountLayer = require('./pilote/accounts/index.js');
const bodyParser = require("body-parser");

const port = Configuration.server.port;
const serverAdress = Configuration.server.base_address;



// The code that's returned as a query parameter to the redirect URI
//var code = generateRandomString(16);




var app = express();

app.use(express.static(__dirname + '../crossDSN/'))
   .use(cors())
   .use(bodyParser.urlencoded({
    extended: true
   }))
   .use(bodyParser.json())
   .use(cookieParser());

app.use(function(req, res, next){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    //Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

    //Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "X-requested-with,content-type");

    next();
});

/**
 * GET
 * Get the OAuth url for the demanded sservice
 * Redirect to /callback/:service
 */
app.get('/api/login/:service', function(req, res) {
  var oAuthURL = accountLayer.getSpotifyOAuthURL(req.params.service);
  if(oAuthURL == null){
      res.send({
          success: false, 
          error: "Unknown service: "+req.params.service
      });
  }else{
      res.send({
          success: true, 
          url: oAuthURL
      });
  }
});

/**
 * GET 
 * Callback for authentication
 * Returns to client home with account_id
 */
app.get('/api/callback/login/:service', function(req, res) {

    var code = req.query.code || null;
    var service = req.params.service || null;

    var redirectUrl = Configuration.public.base_address+":"+Configuration.public.port;

    if(code==null || service==null){
        res.redirect(redirectUrl + querystring.stringify({
            success: false,
            error: "Missing parameters"
            })
        );
    }else if (req.query.error){
        res.redirect(redirectUrl + querystring.stringify({
            success: false,
            error: "Can't connect to "+service+" :/"
            })
        );
    } else {
        accountLayer.createAndGetAccountId(code, service, function(retour){
            res.clearCookie("account_id_"+service);
            if(retour.success){
                res.cookie("account_id_"+service, retour.data.account_id);
                res.redirect(redirectUrl);
            }else{
                res.redirect(redirectUrl+querystring.stringify(retour));
            }
        });
    }
});




app.get('/api/user/:account_id', function(req, res){
  console.log(req.body)
  if(req.params.account_id == null){
    res.send({
      success : false, 
      error: "The account_id is missing"
    });
  }else{
    accountLayer.getUserInfos(req.params.account_id, function(data){
        res.send(data);
    });
  }
});

/**
 * Create the playlist
 */
app.post('/api/playlist/:name', function(req, ret){
  
});




console.log('Listening on '+port);
app.listen(port);
