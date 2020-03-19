
var express = require('express');
var path = require('path');
var uuidv4 = require("uuid/v4");
var generator = require('generate-password');

var bodyParser = require('body-parser');

var app = express();
var port = 8090;

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



mongoose.connect('mongodb://youmeoadmin:bla1bla1@ds161804.mlab.com:61804/youmeo-users', function (err) {
    if(err){
        throw err;
    }else{
        console.log('mongo connected');
    }
});

//declare schema USER
var UserSchema = Schema({
    user_id: String,
    firstname: String,
    lastname : String,
    email : {type: String, unique:true},
    password : String,
    admin: Boolean,
    active : Boolean,
});


//Init model
var UserModel = mongoose.model('users', UserSchema);

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


module.exports = {
    /**
     * Renvoie si oui ou non l'utilisateur est admin
     * @param {*} id 
     * @param {*} cb 
     */
    isAdmin: function(id, cb){
        UserModel.findOne({user_id:id}, 'admin', function(err,data){
            if(err || data==null ){
                cb(false);
            }else{
                cb(true);
            }
        })
    },

    /**
     * Obtient la liste des utilisateurs 
     * @param {*} cb 
     */
    getAllUsers: function(cb){
        UserModel.find({}, function(err, data){
            if(err){
                throw err;
            }else{
                if(data == null){
                    data = [];
                }
                cb({success:true, data:data});
            }
        })  
    },

    /**
     * Ajoute le compte donné a la BDD, renvoie s'id si succès
     * @param {*} user 
     * @param {*} cb 
     */
    addAccount: function(user, cb){
        var userToAdd = new UserModel({
            user_id : uuidv4(),
            lastname: user.lastname,
            firstname:user.firstname,
            email: user.email,
            password:user.password,
            admin:false,
            active:true
        });
        userToAdd.save(function(err){
            if(err){
                cb({success: false});
            }else{
                cb({success :true, user_id:userToAdd.user_id});
            }
        });
    },

    /**
     * Met a jour le password donné pour l'email fourni
     * Renvoie  le succès
     * @param {*} data 
     * @param {*} cb 
     */
    updatePassword: function(data,cb){
        UserModel.findOneAndUpdate({email: data.email}, {password: data.password}, function(err, doc){
            if(err || doc == null){
                if(err){
                    throw err;
                }
                cb(false);
            }else{
                cb(true);
            }
        });
    },

    /**
     * Supprime le compte associé au user_id fouri
     * @param {*} user_id 
     * @param {*} cb 
     */
    deleteAccount : function(user_id, cb){
        UserModel.deleteOne({user_id:user_id},function(err,res){
            if(err){
                throw err;
            }else{
                if(res.deleteCcount == 0){
                    cb(false);
                }else{
                    cb(true);
                }
            }
        });
    },

    /**
     * Obtient le user_id si le compte est vérifié
     * @param {*} data 
     * @param {*} cb 
     */
    getUserId : function(data, cb){
        UserModel.findOne({email:data.email, password:data.password},'user_id active', function(err, res){
            if(err){
                throw err;
            }else{
                if(res == null){
                    cb({success:false});
                }else{
                    cb({success:true, user_id:res.user_id, active:res.active});
                }
            }
        });
    },

    /**
     * Renvoie un UserObject
     * @param {*} user_id 
     * @param {*} cb 
     */
    getUserObject: function(user_id,cb){
        UserModel.find({user_id:user_id},'firstname lastname email active admin user_id', function(err, res){
           
            if(err){
                throw err;
                
            }else{
                if(res == null){
                    cb({success:false});
                }else{
                    cb({
                        success:true, 
                        data: res
                    });
                }
            }
        });
    },

    /**
     * Change la valeur du champ donné pour l'utilisateur précisé
     * @param {*} user_id 
     * @param {*} field 
     * @param {*} value 
     * @param {*} cb 
     */
    changeValue : function(user_id, field, value, cb){
        var update = {};
        update[field] = value;

        UserModel.updateOne({user_id : user_id}, {$set:update},function(err, doc){
            if(err){
                throw err;
            }else{
                if(doc.modifiedCount == 0){
                    cb(false);
                }else{
                    cb(true);
                }
            }
        })
    }
};


////////////////
console.log("Server started port " + port);
if(process.env.PORT !== undefined){
    port= process.env.PORT;
}
app.listen(port);