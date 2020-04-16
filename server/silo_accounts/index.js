
const Services = {
    DEEZER : 'deezer',
    SPOTIFY : 'spotify',
};

var express = require('express');
var path = require('path');
var SpotifyWebApi = require('spotify-web-api-node');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var credentials = {
    clientId: '8f6c8d03f6804e17b0757a1645854d4f',
    clientSecret: 'b1567c32522c434c8c25611c51ac9d8f',
    redirectUri: "http://localhost:8888/api/spotify/login/callback/"
  };
var scopes = ['user-read-private', 'user-read-email'];
var spotifyApi = new SpotifyWebApi(credentials);

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



var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//for generate GUID
var uuidv4 = require("uuid/v4");



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
    service : {type :String, enum : [Services.SPOTIFY, Services.DEEZER]},
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

// IS ADMIN
app.post('/silo/isAdmin', function(request, response){
    module.exports.isAdmin(request.body.user_id, function(res){
        response.send(res);
    })
});

// GET ALL USERS
app.post('/silo/getAllUsers', function(request, response){
    module.exports.getAllUsers(function(res){
        response.send(res);
    });
});

// ADD ACCOUNT
app.post('/silo/addAccount', function(request, response){
    module.exports.addAccount(request.body, function(res){
        response.send(res);
    });
});

// UPDATE PASSWORD
app.post('/silo/updatePassword/', function(request, response){
    module.exports.updatePassword(request.body, function(res){
        response.send(res);
    });
});

// DELETE ACCOUNT
app.post('/silo/deleteAccount', function(request, response){
    module.exports.deleteAccount(request.body.user_id, function(res){
        response.send(res);
    });
});

// GET USER ID
app.post('/silo/getUserId', function(request, response){
    module.exports.getUserId(request.body, function(res){
        response.send(res);
    });
});

// GET USER OBJ
app.post('/silo/getUserObject', function(request, response){
    module.exports.getUserObject(request.body.user_id, function(res){
        response.send(res);
    });
});

// CHANGE VALUE
app.post('/silo/changeValue', function(request, response){
    module.exports.changeValue(request.body.user_id, request.body.field, request.body.value, function(res){
        response.send(res);
    });
});

function getExpirationDate(expires_in){
    return new Date((new Date()).getTime()+expires_in*1000);
}

function updateSpotifyToken(access_token, cb){
    AccountModel.findOne({service: Services.SPOTIFY ,  spotify_service: {access_token: access_token}}, function(err, data){
        if(err || data==null){
            console.log(err);
        }else{
            var dateNow = new Date();
            if(dateNow>data.spotify_service.expire_date){
                spotifyApi.setRefreshToken(data.spotify_service.refresh_token);
                spotifyApi.refreshAccessToken().then(
                    function(newData) {
                        console.log('The access token has been refreshed!');
                  
                        // Save the access token so that it's used in future calls
                        spotifyApi.setAccessToken(newData.body['access_token']);

                        //Modify expire date and 
                        data.spotify_service.expire_date.setMilliseconds(getExpirationDate(3600));
                        data.spotify_service.access_token = newData.body['access_token'];
                        data.markModified('spotify_service.expire_date');
                        data.save(function(ret){
                            cb(newData.access_token);
                        })
                    },
                    function(err) {
                      console.log('Could not refresh access token', err);
                    }
                  );
            }else{
                cb(access_token);
            }
        }
    })
}

module.exports = {    
    /**
     * Connecte un compte spotify : 
     *  - si le compte n'existe pas il est ajouté
     *  - si il existe, le compte est mis à jour
     * 
     * Renvoie l'access_token
     * @param {*} refresh_token 
     * @param {*} access_token 
     * @param {*} expires_in 
     * @param {*} display_name 
     * @param {*} username 
     * @param {*} picture_url
     * @param {*} email 
     * @param {*} cb 
     */
    createSpotifyAccount: function(
        refresh_token, 
        access_token,
        expires_in, 
        display_name, 
        username, 
        picture_url,
        email,
        cb)
        {
        
            var query = {service: Services.SPOTIFY ,  email: email};
            var account = {
                account_id: uuidv4(),
                display_name : display_name,
                username: username,
                picture_url : picture_url,
                email : email, 
                service : Services.SPOTIFY,
                spotify_service: {
                    refresh_token:refresh_token,
                    access_token: access_token,
                    expire_date : getExpirationDate(expires_in)
                }
            };

        AccountModel.findOne(query, function(err,data){
            console.log(data);
            if(err){
                console.log(err);
                cb({sucess: false, data: err});
            }else if(data == null){ // si pas dans la base : ajout
                
                var accountToAdd = new AccountModel(account);
                accountToAdd.save(function (err, account){
                    if(err){
                        cb({success: false, data :err});
                    }else{
                        cb({success :true, access_token:account.spotify_service.access_token});
                    }
                });
            }else{ // si dans la base 
                cb({success :true, access_token:data.spotify_service.access_token});
                /*
                var accountToAdd = new AccountModel(account);
                accountToAdd.save(function(err, account){
                    if(err){
                        cb({success: false, data :err});
                    }else{
                        cb({success :true, data:account});
                    }
                });
                */
            }
        })
    },

    /**
     * Connecte un compte Deezer : 
     *  - si le compte n'existe pas il est ajouté
     *  - si il existe, le compte est mis à jour
     * Renvoie l'access_token'
     * @param {*} access_token 
     * @param {*} display_name 
     * @param {*} username 
     * @param {*} picture_url 
     * @param {*} email 
     * @param {*} cb 
     */
    createDeezerAccount: function(
        access_token, 
        display_name, 
        username, 
        picture_url,
        email,
        cb)
        {
        
            var query = {service: Services.DEEZER ,  email: email};
            var account = {
                account_id: uuidv4(),
                display_name : display_name,
                username: username,
                picture_url : picture_url,
                email : email, 
                service : Services.DEEZER,
                deezer_service: {
                    access_token: access_token,
                }
            };

        AccountModel.findOne(query, function(err,data){
            if(err){
                console.log(err);
                cb({sucess: false, data: err});
            }else if(data == null){ // si pas dans la base : ajout
                
                var accountToAdd = new AccountModel(account);
                accountToAdd.save(function (err, account){
                    if(err){
                        cb({success: false, data :err});
                    }else{
                        cb({success :true, access_token:account.deezer_service.access_token});
                    }
                });
            }else{ // si dans la base 
                cb({success :true, access_token:data.deezer_service.access_token});
                /*
                var accountToAdd = new AccountModel(account);
                accountToAdd.save(function(err, account){
                    if(err){
                        cb({success: false, data :err});
                    }else{
                        cb({success :true, data:account});
                    }
                });
                */
            }
        })
    },

    /**
     * Get the user info for the spotify account associated with the access_token
     * (automatically refresh token if necessary)
     * @param {String} access_token 
     * @param {Callback} cb 
     */
    getSpotifyAccountInfo: function(access_token, cb){
        updateSpotifyToken(access_token, function(new_access_token){
            AccountModel.findOne({spotify_service:{access_token: access_token}}, function(err, data){
                if(err || data == null){
                    console.log(err);
                    cb({success: false, data: err});
                }else{
                    cb({success: true, 
                        data: {
                            display_name: data.display_name,
                            username: data.username,
                            picture_url: data.picture_url,
                            email: data.email,
                            access_token: data.spotify_service.access_token
                        }})
                }
            });
        });
    },

    /**
     * Get the user info for the deezer account associated with the access_token
     * @param {String} access_token 
     * @param {Callback} cb 
     */
    getDeezerAccountInfo: function(access_token, cb){
        AccountModel.findOne({deezer_service:{access_token: access_token}}, function(err, data){
            if(err || data == null){
                console.log(err);
                cb({success: false, data: err});
            }else{
                cb({success: true, 
                    data: {
                        display_name: data.display_name,
                        username: data.username,
                        picture_url: data.picture_url,
                        email: data.email,
                        access_token: data.deezer_service.access_token
                    }})
            }
        });
    },
    
    

}
