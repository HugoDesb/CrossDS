
var request = require('request')
var request = require('querystring');

var credentials = {
    app_id: '8f6c8d03f6804e17b0757a1645854d4f',
    secret: 'b1567c32522c434c8c25611c51ac9d8f',
    redirectUrl: "http://localhost:8888/api/spotify/login/callback/"
};

var scopes = 'basic_access,email,offline_access,manage_library';





module.exports = {

    /**
     * Obtain the OAtuthURL to login
     */
    getOAuthURL(){
        var authorizeURL = "https://connect.deezer.com/oauth/auth.php?"+querystring.stringify({
            app_id : credentials.app_id,
            redirect_uri : credentials.redirectUrl,
            perms : scopes
        });
        return authorizeURL;
    }, 

    /**
     * Given the code in response to the user logging in, obtains the tokens 
     * @param {String} code 
     * @param {Callback} callback 
     */
    getTokens(code, callback){
        var url = 'https://connect.deezer.com/oauth/access_token.php?'+querystring.stringify({
            app_id : credentials.app_id,
            secret : credentials.secret, 
            code: code,
            output: "json"
        });
        request.get(url, { json: true }, (err, res, data) => {
            if (err) { 
                console.log("Error"); 
                throw err;
            }else{
                console.log(data);
                if(data.error){
                    callback({
                        success: false,
                        error: data.error
                    });
                }else{
                    callback({
                        success: false,
                        data: {
                            access_token: data.access_token
                        }
                    });
                }
                
            }
        });
    },

    /**
     * Get the basic infos for the account linked to the acces_token
     * @param {String} access_token 
     * @param {Callback} callback 
     */
    getUserInfos(access_token, callback){
        var url = "https://api.deezer.com/user/me"+querystring.stringify({
            access_token : access_token,
            output:'json'
        });
        request.get(url, {json: true}, (err, res, data ) =>{
            if(err){
                console.log("Error"); 
                throw err;
            }else{
                if(data.error){
                    v
                }else{
                    callback({
                        success: true,
                        data:{
                            display_name: data.name,
                            username: data.id,
                            picture_url: data.picture_medium,
                            email: data.email
                        }
                    });
                }
            }
        });
    },

    /**
     * Create a private playlist with the given name
     * @param {String} name 
     * @param {String} access_token 
     * @param {Callback} callback 
     */
    createPlaylist(name, access_token, callback){
        var url = "https://api.deezer.com/user/me"+querystring.stringify({
            access_token : access_token,
            title: name,
            output:'json'
        });
        request.post(url, {json: true}, (err, res, data ) =>{
            if(err){
                console.log("Error"); 
                throw err;
            }else{
                if(data.error){
                    callback({
                        success: false,
                        error: data.error
                    });
                }else{
                    callback({
                        success: true,
                        data:{
                            id: data.id,
                            name: data.title,
                            external_url: data.link
                        }
                    });
                }
            }
        });
    },

    /**
     * Search for a track
     *  Primarily by its ISRC code, 
     *  Secondly (if it wasn't found using isrc code), by track name and artist name 
     * @param {String} isrc 
     * @param {String} track_name 
     * @param {String} artist_name 
     * @param {String} access_token 
     * @param {Callback} callback 
     */
    searchTrack(isrc, track_name, artist_name, access_token, callback){
        var url = "https://api.deezer.com/2.0/track/isrc:"+isrc;
        request.get(url, {json: true}, (err, res, data ) =>{
            if(err){
                console.log("Error"); 
                throw err;
            }else{
                if(data.error){
                    //search by track name + artist
                    var url2 = "https://api.deezer.com/search?q=track:\""+track_name+"\" artist:\""+artist_name+"\"";
                    request.get(url2, {json: true}, (err2, res2, data2)=>{
                        if(err2){
                            console.log("Error");
                            throw err2;
                        }else{
                            if(data2.error){
                                callback({
                                    success: false,
                                    error: data2.error
                                });
                            }else if(data2.data.length==0){
                                callback({
                                    success: false,
                                    error: "No Results"
                                });
                            }else{
                                callback({
                                    success: true,
                                    data: {
                                        id: data2.data[0].id,
                                        name: data2.data[0].title,
                                        external_url: data2.data[0].link,
                                        isrc: data2.data[0].isrc
                                    }
                                });
                            }
                        }
                    })
                }else{
                    callback({
                        success: true,
                        data : {
                            id: data.id,
                            name: data.title,
                            external_url: data.link,
                            isrc: data.isrc
                        }
                    });
                }
            }
        });
    }, 


    /**
     * Adds to a playlist specified by the playlist_id the tracks for which uri are provided
     * 
     * Returns the success plus the error if unsuccessful
     * 
     * @param {Array<String>} tracks_ids An array of track ids (the tracks to add)
     * @param {string} playlist_id 
     * @param {String} access_token 
     * @param {Callback} callback 
     */
    addtracksToPlaylist(tracks_ids,playlist_id, access_token, callback){
        var url = "https://api.deezer.com/playlist/908622995/tracks"
        console.log("Not Yet Implemented");
    }
}