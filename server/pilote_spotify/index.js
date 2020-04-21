
var SpotifyWebApi = require('spotify-web-api-node');
var credentials = {
    clientId: '8f6c8d03f6804e17b0757a1645854d4f',
    clientSecret: 'b1567c32522c434c8c25611c51ac9d8f',
    redirectUri: "http://localhost:8888/api/spotify/login/callback/"
  };
var spotifyApi = new SpotifyWebApi(credentials);

var scopes = ['user-read-private', 'user-read-email', 'playlist-modify-public', 'playlist-modify-private',  'playlist-read-public', 'playlist-read-private'];

/**
 * Update IF necessary the access_token
 * Callback with the working tokens
 * @param {Object} tokens 
 * @param {Callback} callback 
 */
function refresh_tokens(tokens, callback){
    var tok =  tokens;

    var dateNow = new Date();
    if(dateNow>tokens.expire_date){
        spotifyApi.setRefreshToken(tokens.refresh_token);
        spotifyApi.refreshAccessToken().then(
            function(refreshedTokens) {
                console.log('The access token has been refreshed!');
            
                // Save the access token so that it's used in future calls
                spotifyApi.setAccessToken(newTokens.body['access_token']);

                tok.access_token = newTokens.body['access_token'];
                tok.expire_date = getExpirationDate(3600);
            },
            function(err) {
                console.log('Could not refresh access token', err);
            }
        );
    }

    callback(tok);
}

/**
 * Compute the expiration date given a expiration delay in seconds
 * @param {Number} expires_in 
 */
function getExpirationDate(expires_in){
    return new Date((new Date()).getTime()+expires_in*1000);
}


module.exports = {

    /**
     * Obtain the OAtuthURL to login
     */
    getOAuthURL(){
        var state = generateRandomString(16);
        var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
        return authorizeURL;
    }, 

    /**
     * Given the code in response to the user logging in, obtains the tokens 
     * @param {string} code 
     * @param {Callback} callback 
     */
    getTokens(code, callback){
        spotifyApi.authorizationCodeGrant(code).then(function(data) {    
            callback({
                access_token : data.body['access_token'],
                refresh_token: data.body['refresh_token'],
                expire_date: getExpirationDate(data.body['expires_in'])
            });
        }, function(err){
            console.log('Something went wrong!', err);
            throw err;
        });
    },

    /**
     * Get the basic infos for the account linked to the acces_token
     * @param {Object} tokens 
     * @param {Callback} callback 
     */
    getUserInfos(tokens, callback){
        refresh_tokens(tokens, function(tok){
            spotifyApi.setAccessToken(tok.access_token);
            spotifyApi.getMe().then(
                function(me){
                    callback({
                        refresh_token: tok.refresh_token,
                        access_token: tok.access_token,
                        expires_date: tok.expires_date,
                        display_name: me.body.display_name,
                        username: me.body.id,
                        picture_url: me.body.images[0].url,
                        email: me.body.email,
                    });
                }, function(err){
                    console.log('Something went wrong!', err);
                    throw err;
                }
              );
        });
    },

    /**
     * Create a private playlist with the given name
     * @param {String} name 
     * @param {Object} tokens 
     * @param {Callback} callback 
     */
    createPlaylist(name, tokens, callback){
        refresh_tokens(tokens, function(tok){
            spotifyApi.setAccessToken(tok.access_token);
            // Create a private playlist
            spotifyApi.createPlaylist(name, { 'public' : false }).then(function(data) {
                console.log('Created playlist!');
                console.log(data.body);
                callback({
                    success: true, 
                    data: {
                        id: data.body.id,
                        name: data.body.name,
                        uri: data.body.uri, 
                        external_url: data.body.external_urls.spotify 
                    },
                    tokens:tok
                });
            }, function(err) {
                console.log('Something went wrong!', err);
                throw err;
            });
        });
    },

    /**
     * Search for a track
     *  Primarily by its ISRC code, 
     *  Secondly (if it wasn't found using isrc code), by track name and artist name 
     * @param {String} isrc 
     * @param {String} track_name 
     * @param {String} artist_name 
     * @param {Object} tokens 
     * @param {Callback} callback 
     */
    searchTrack(isrc, track_name, artist_name, tokens, callback){
        refresh_tokens(tokens, function(tok){
            spotifyApi.setAccessToken(tok.access_token);
            
            //First search by isrc
            spotifyApi.searchTracks('isrc:'+isrc).then(function(data) {
                console.log('Search tracks by isrc', data.body);
                //If results returned
                if(data.body.tracks.items.lentgh != 0){
                    callback({
                        success: true,
                        tokens, tok,
                        data: {
                            id: data.body.tracks.item[0].id,
                            uri: data.body.tracks.item[0].uri,
                            name: data.body.tracks.item[0].name,
                            isrc: data.body.tracks.item[0].external_ids.isrc
                        }
                    })
                }else{
                    //No results --> search by track name and artist
                    spotifyApi.searchTracks('track:'+track_name+' artist:'+artist_name).then(function(data) {
                        console.log('Search tracks by name and artist', data.body);
                        if(data.body.tracks.items.lentgh==0){
                            callback({
                                success: true,
                                tokens, tok,
                                data: null
                            });
                        }else{
                            callback({
                                success: true,
                                tokens: tok,
                                data: {
                                    id: data.body.tracks.item[0].id,
                                    uri: data.body.tracks.item[0].uri,
                                    name: data.body.tracks.item[0].name,
                                    isrc: data.body.tracks.item[0].external_ids.isrc
                                }
                            });
                        }
                    }, function(err) {
                        console.log('Something went wrong!', err);
                        throw err;
                    }); 
                }
            }, function(err) {
                console.log('Something went wrong!', err);
                throw err;
            });
            
        });
    }, 


    /**
     * Adds to a playlist specified by the playlist_id the tracks for which uri are provided
     * 
     * Returns the success plus the error if unsuccessful
     * 
     * @param {Array<String>} tracks_uri An array of track uri (the tracks to add)
     * @param {string} playlist_id 
     * @param {Object} tokens 
     * @param {Callback} callback 
     */
    addtracksToPlaylist(tracks_uri,playlist_id, tokens, callback){
        refresh_tokens(tokens, function(tok){
            spotifyApi.setAccessToken(tok.access_token);
            // Add tracks to playlist

            spotifyApi.addTracksToPlaylist(playlist_id, tracks_uri).then(function(data) {
                if(data.body.snapshot_id){
                    console.log('Added tracks to playlist!');
                    callback({
                        success: true
                    });
                }else{
                    //if playlist doesn't exists or stuff like that
                    callback({success: false, data: data.body});
                }
            }, function(err) {
                console.log('Something went wrong!', err);
                throw err;
            });
        });
    }
}