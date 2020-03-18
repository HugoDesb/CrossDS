
/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
const port = 8888;
const serverAdress = "http://localhost"


var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = '8f6c8d03f6804e17b0757a1645854d4f'; // Your client id
var client_secret = 'b1567c32522c434c8c25611c51ac9d8f'; // Your secret
var redirect_uri = serverAdress+':'+port+'/callback/spotify'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '../crossDSN/'))
   .use(cors())
   .use(cookieParser());

app.use(function(req, res, next){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200/');

    //Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

    //Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "X-requested-with,content-type");

    next();
});

/**
 * GET
 * Connect via OAuth2.0 to spotify
 * Redirect to /callback/spotify
 */
app.get('/login/spotify', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  console.log(req);
  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

/**
 * GET 
 * Callback for authentication
 * Request access and refresh token
 * Returns to client home with both key
 */
app.get('/callback/spotify', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
      res.send({
          error:'state_mismatch'
      });
      
    res.redirect('http://localhost:4200/#' +
      querystring.stringify({
        spotify_error: 'state_mismatch'
      }));
      
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
            console.log(body);
            
            /*
            res.send({
                display_name:body.display_name,
                access_token: access_token,
                refresh_token : refresh_token
            });
            */
        });

        // we can also pass the token to the browser to make requests from there
        
        
        res.redirect('http://localhost:4200/#' +
          querystring.stringify({
            spotify_access_token: access_token,
            spotify_refresh_token: refresh_token
          }));
          
      } else {
          res.send({
              error: 'invalid token'
          });
          
        res.redirect('http://localhost:4200/#' +
          querystring.stringify({
            spotify_error: 'invalid_token'
          }));
          
      }
    });
  }
});

/** 
 * GET 
 * Refresh the access token for the spotify user
 */
app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        spotify_access_token: access_token
      });
    }
  });
});

console.log('Listening on '+port);
app.listen(port);