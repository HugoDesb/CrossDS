
const Services = {
    DEEZER : 'deezer',
    SPOTIFY : 'spotify',
};

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var uuidv4 = require("uuid/v4");

var spotifyApi = require('../../silo/spotifyAPI/index.js');
var deezerApi = require('../../silo/deezerAPI/index.js');

var app = express();





app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'public')));   


app.use(function(req, res, next){
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    //Request methods you wish to allow
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");

    //Request headers you wish to allow
    res.setHeader("Access-Control-Allow-Headers", "X-requested-with,content-type");

    next();
});




var Schema = mongoose.Schema;

//for generate GUID




mongoose.connect('mongodb://localhost:27017/crossDSN', function (err) {
    if(err){
        throw err;
    }else{
        console.log('mongo connected');
    }
});

//declare schema USER
var AccountSchema = Schema({
    account_id : {type: String, unique: true},
    display_name: String,
    username: String,
    picture_url : String,
    email : String,
    service : {
        type : String, 
        enum : [Services.SPOTIFY, Services.DEEZER]},
    spotify_service : {
        refresh_token : String,
        access_token :String,
        expire_date : Date //spotify access tokens expires in 1 hour (3600 sec)
    },
    deezer_service : {
        access_token : String,
    }
});
AccountSchema.index({ email: 1, service: 1}, { unique: true });

//Init model
var AccountModel = mongoose.model('accounts', AccountSchema);

function createSpotifyAccount(tokens, callback){
    spotifyApi.getUserInfos(tokens, function(retour){
        //reset if necessary spotify tokens

        var new_tokens = retour.tokens;
        if(!retour.success){
            callback({
                success: false,
                error: retour.error
            });
        }else{
            var newAccount = new AccountModel({
                account_id: uuidv4(),
                display_name : retour.data.display_name,
                username: retour.data.username,
                picture_url : retour.data.picture_url,
                email : retour.data.email, 
                service : Services.SPOTIFY,
                spotify_service: new_tokens
            });
            newAccount.save(function(err, data){
                if(err){
                    console.log("Error");
                    throw err;
                }else{
                    callback({
                        success: true, 
                        data: {
                            account_id: data.account_id
                        }
                    });
                }
            })
        }
    })
}

function createDeezerAccount(token, callback){
    deezerApi.getUserInfos(token, function(retour){

        if(!retour.success){
            callback(retour);
        }else{
            var newAccount = new AccountModel({
                account_id: uuidv4(),
                display_name : retour.data.display_name,
                username: retour.data.username,
                picture_url : retour.data.picture_url,
                email : retour.data.email, 
                service : Services.DEEZER,
                deezer_service: {
                    access_token: token
                }
            });
            newAccount.save(function(err, data){
                if(err){
                    console.log("Error");
                    throw err;
                }else{
                    callback({
                        success: true, 
                        data: {
                            account_id: data.account_id
                        }
                    });
                }
            })
        }
    })
}
/**
 * Returns the right tokens
 * update in db btw
 * @param {String} account_id 
 * @param {Object} old_tokens 
 * @param {Object} new_tokens 
 */
function updateSpotifyTokens(account_id, old_tokens, new_tokens){
    if(old_tokens.access_token != new_tokens.access_token){
        //update in db
        AccountModel.findOne({account_id: account_id}, function(err, doc){
            doc.spotify_service.expire_date = new_tokens.expire_date;
            doc.spotify_service.refresh_token = new_tokens.refresh_token;
            doc.spotify_service.access_token = new_tokens.access_token;
            doc.markModified('spotify_service.expire_date');
            doc.save(function(err, data){
                if(err){
                    console.log('Error');
                    throw err;
                }else{
                    return new_tokens;
                }
            })
        })
    }
    return new_tokens;
}

module.exports = {  
    
    /**
     * Returns the OAuth URL corresponding to the service
     * null if service unknown
     * @param {Services} service 
     */
    getSpotifyOAuthURL: function(service){
        switch(service){
            case Services.SPOTIFY:
                return spotifyApi.getOAuthURL();
            case Services.DEEZER:
                return deezerApi.getOAuthURL();
            default:
                return null;
        }
    },

    /**
     * Create the account and get the newly created account its id
     * @param {Strong} code 
     * @param {Services} service
     */
    createAndGetAccountId: function(code, service, callback){
        switch(service){
            case Services.SPOTIFY: 
                spotifyApi.getTokens(code, function(ret){
                    if(!ret.success){
                        callback({
                            success: false,
                            error: "Impossible de se connecter à "+service
                        });
                    }else{
                         var tokens = ret.tokens;

                        AccountModel.findOne({service: service, spotify_service:{ refresh_token: tokens.refresh_token}}, function(err, doc){
                            console.log(doc);
                            if(err){
                                console.log("Error1");
                                throw err;
                            }else if(doc){
                                callback({
                                    success: true,
                                    data: {
                                        account_id: doc.account_id
                                    }
                                });
                            }else{
                                createSpotifyAccount(tokens, function(data){
                                    callback(data)
                                });
                            }
                        });
                    }
                });
                break;
            case Services.DEEZER: 
                deezerApi.getTokens(code, function(ret){
                    if(!ret.success){
                        callback({
                            success: false,
                            error: "Impossible de se connecter à "+service
                        });
                    }else{
                        var token = ret.access_token;

                        AccountModel.findOne({service: service, deezer_service:{access_token: token}}, function(err, doc){
                            console.log(doc);
                            if(err){
                                console.log("Error");
                                throw err;
                            }else if(doc){
                                console.log("hep", doc.account_id);
                                callback({
                                    success: true,
                                    data: {
                                        account_id: doc.account_id
                                    }
                                });
                            }else{
                                createDeezerAccount(token, function(data){
                                    console.log("hop", data)
                                    callback(data)
                                });
                            }
                        })
                    }
                });
                break;
            default: 
                callback({
                    success: false,
                    error: "Unknown service: '"+service+"'"
                });
            
        }
    },

    /**
     * Gets the user info given its account_id
     * @param {String} account_id 
     * @param {Callback} callback 
     */
    getUserInfos: function(account_id, callback){
        AccountModel.findOne({account_id: account_id}, function(err, doc){
            if(err){
                console.log('Error');
                throw err
            }else if(doc == null){
                callback({
                    success: false, 
                    error: "Unknown account_id: '"+ account_id+"'"
                })
            }else{
                callback({
                    success: true,
                    data: {
                        display_name: doc.display_name,
                        username: doc.username,
                        picture_url: doc.picture_url,
                        email: doc.email,
                        service_name: doc.service
                    }
                });
            }
        });
    },
    
    Services : {
        DEEZER : 'deezer',
        SPOTIFY : 'spotify',
    }
}
