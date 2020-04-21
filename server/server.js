
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
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');
var accountLayer = require('./silo_accounts/index.js');
var spotifyPilot = require('./pilote_spotify/index.js')
const bodyParser = require("body-parser");

const port = Configuration.server.port;
const serverAdress = Configuration.server.base_address;
const server = serverAdress+":"+port;

var credentials = {
  clientId: Configuration.spotify.clientID,
  clientSecret: Configuration.spotify.clientSecret,
  redirectUri: server+'/api/spotify/login/callback/'
};
var scopes = Configuration.spotify.scopes;
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
 * Connect via OAuth2.0 to Deezer
 * Redirect to /callback/spotify
 */
app.get('/api/spotify/login', function(req, res) {
  res.cookie(stateKey, state);
  res.send({success: true, data: spotifyPilot.getOAuthURL()});
});

/**
 * GET
 * Connect via OAuth2.0 to Deezer
 * Redirect to -----
 */
app.get('/api/deezer/login', function(req, res) {
  var authorizeURL = "https://connect.deezer.com/oauth/auth.php?"+querystring.stringify({
    app_id : 	Configuration.deezer.app_id,
    redirect_uri : server+"/api/deezer/login/callback",
    perms : Configuration.deezer.perms
  });
  res.send({success: true, data: authorizeURL});
  //res.redirect(authorizeURL);
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

  var redirectUrl = Configuration.public.base_address+":"+Configuration.public.port+"/callback/spotify?";

  if (state === null || state !== storedState) {
      res.send({
          error:'state_mismatch'
      });

  }else if (req.query.error){
    res.redirect(redirectUrl +
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

        //Après l'autorisation, on ajoute l'utilisateur dans la base
        // Récupération infos
        spotifyApi.getMe().then(
          function(me){
            //Ajout ds la base
            accountLayer.createSpotifyAccount(
                data.body.refresh_token, 
                data.body.access_token, 
                data.body.expires_in, 
                me.body.display_name,
                me.body.id,
                me.body.images[0].url,
                me.body.email, 
                function(ret){
                  //Callback vers le front avec l'access_token
                  res.cookie("spotify_access_token", ret.access_token);
                  res.redirect(Configuration.public.base_address+":"+Configuration.public.port/*+"/spotify/callback/?" + 
                    querystring.stringify({
                      spotify_access_token : ret.access_token
                    })*/
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
  if(req.query.error_reason=="user_denied"){
    res.redirect("http://localhost:4200/spotify/callback?"+querystring.stringify({
      deezer_error: "Can't connect to Deezer :/"
    }));
  }else{
    var code = req.query.code;

    var accessTokenURL = 'https://connect.deezer.com/oauth/access_token.php?'+querystring.stringify({
      app_id : Configuration.deezer.app_id,
      secret : 	Configuration.deezer.secret, 
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
              accountLayer.createDeezerAccount(res1.body.access_token, res2.body.name, res2.body.id, res2.body.picture_medium, res2.body.email , function(ret){
                res.cookie("deezer_access_token", ret.access_token);
                res.redirect(Configuration.public.base_address+":"+Configuration.public.port/*+"?" + 
                    querystring.stringify({
                      deezer_access_token : ret.access_token
                    })*/
                  );
              });
            }
        });
      }
      
    });
  }
});


app.post('/api/user/info', function(req, res){
  console.log(req.body)
  if(req.body.access_token == null || req.body.service == null){
    res.send({
      success : false, 
      err: "The access_token or the service is missing"
    });
  }else{
    console.log("HOP")
    if(req.body.service == accountLayer.Services.SPOTIFY){
      console.log("HOP2")
      accountLayer.getSpotifyAccountInfo(req.body.access_token, function(ret){
        console.log("Retour OK");
        res.send(ret);
      });
    }else if(req.body.service == accountLayer.Services.DEEZER){
      accountLayer.getDeezerAccountInfo(req.body.access_token, function(ret){
        res.send(ret);
      });
    }else{
      res.send({
        success: false, 
        data: "The service provided isn't supported"
      })
    }
  }
});

/**
 * Create the playlist
 */
app.post('/api/playlist/:name', function(req, ret){
  
});




console.log('Listening on '+port);
app.listen(port);
