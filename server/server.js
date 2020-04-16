
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
var SpotifyWebApi = require('spotify-web-api-node');

var accountLayer = require('./silo_accounts/index.js');


var credentials = {
  clientId: '8f6c8d03f6804e17b0757a1645854d4f',
  clientSecret: 'b1567c32522c434c8c25611c51ac9d8f',
  redirectUri: serverAdress+':'+port+'/api/spotify/login/callback/'
};

var scopes = ['user-read-private', 'user-read-email'];

var spotifyApi = new SpotifyWebApi(credentials);


// The code that's returned as a query parameter to the redirect URI
//var code = generateRandomString(16);



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
    res.setHeader('Access-Control-Allow-Origin', '*');

    //Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

    //Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "X-requested-with,content-type");

    next();
});

/**
 * GET
 * Connect via OAuth2.0 to Deezer
 * Redirect to /callback/spotify
 */
app.get('/api/spotify/login', function(req, res) {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.send({success: true, data: authorizeURL});
});

/**
 * GET
 * Connect via OAuth2.0 to Deezer
 * Redirect to -----
 */
app.get('/api/deezer/login', function(req, res) {
  var authorizeURL = "https://connect.deezer.com/oauth/auth.php?"+querystring.stringify({
    app_id : 	407522,
    redirect_uri : "http://localhost:8888/api/deezer/login/callback",
    perms : "basic_access,email,offline_access"
  });
  res.send({success: true, data: authorizeURL});
  //res.redirect(authorizeURL);
});

app.get('/api/spotify/user/info', function(req, res){

});


/**
 * GET 
 * Callback for authentication
 * Request access and refresh token
 * Returns to client home with access key (refresh is stored in database)
 */
app.get('/api/spotify/login/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
      res.send({
          error:'state_mismatch'
      });

  }else if (req.query.error){
    res.redirect('http://localhost:4200/?' +
      querystring.stringify({
        spotify_error: "Can't connect to Spotify :/"
      }));
  } else {
    res.clearCookie(stateKey);

    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(code).then(
      function(data) {

        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        spotifyApi.getMe().then(
          function(me){
            accountLayer.createSpotifyAccount(
                data.body.refresh_token, 
                data.body.access_token, 
                data.body.expires_in, 
                me.body.display_name,
                me.body.id,
                me.body.images[0].url,
                me.body.email, 
                function(ret){
                  res.redirect('http://localhost:4200/spotify/callback?' + 
                    querystring.stringify({
                      access_token : ret.data.spotify_service.access_token
                    })
                  );
            });
          }
        );  
      },
      function(err) {
        console.log('Something went wrong!', err);
      }
    );
  }
});



app.get('/api/deezer/login/callback', function(req, res) {
  // http://redirect_uri?error_reason=user_denied
  if(req.query.error_reason=="user_denied"){
    res.redirect("http://localhost:4200/spotify/callback?"+querystring.stringify({
      deezer_error: "Can't connect to Deezer :/"
    }));
  }else{
    var code = req.query.code;

    var accessTokenURL = 'https://connect.deezer.com/oauth/access_token.php?'+querystring.stringify({
      app_id : 407522,
      secret : 	"d482da32d0e5f1360bfa87e3ebb810a8", 
      code: code,
      output: "json"
    });
    request(accessTokenURL, { json: true }, (err1, res1, body1) => {
      if (err1) { 
        return console.log(err1); 
      }else{
        // get user info and set tok
        var userInfoURL = "https://api.deezer.com/user/me?"+querystring.stringify({access_token:res1.body.access_token});
        request(userInfoURL, { json: true }, (err2, res2, body2) => {
            if(err2){
              console.log(err2);
            }else{
              accountLayer.createOrGetDeezerAccount(res1.body.access_token, res2.body.name, res2.body.id, res2.body.picture_medium, res2.body.email , function(ret){
                var hop = {
                  service : ret.data.service,
                  email : ret.data.email,
                  picture_url : ret.data.picture_url,
                  username: ret.data.username,
                  display_name: ret.data.display_name,
                  account_id : ret.data.account_id,
                  access_token : ret.data.deezer_service.access_token
                }
                console.log(hop);
                res.redirect('http://localhost:4200/deezer/callback?' + 
                    querystring.stringify({
                      service : ret.data.service,
                      email : ret.data.email,
                      picture_url : ret.data.picture_url,
                      username: ret.data.username,
                      display_name: ret.data.display_name,
                      account_id : ret.data.account_id,
                      access_token : ret.data.deezer_service.access_token
                    })
                  );
              });
            }
        });
      }
      
    });
  }
});

/** 
 * GET 
 * Refresh the access token for the spotify user
 * Given the refresh token
 */
app.get('/spotify/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  spotifyApi.setRefreshToken(refresh_token);
  spotifyApi.refreshAccessToken().then(
    function(access_token){
      console.log("'/spotify/refresh_token' : "+access_token);
    }
  );
});

console.log('Listening on '+port);
app.listen(port);
