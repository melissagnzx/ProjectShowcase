var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// user scheme
var UserScheme = mongoose.Schema({
    username: {
        type: String,
        index: true
    },
    email: {
        type: String
    },
    password: {
        type: String
    }

});

var User = module.exports = mongoose.model('users',UserScheme);

module.exports.createUser = function (newUser, callback) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            // Store hash in your password DB.
            newUser.password = hash;
            newUser.save(callback);
        });
    });
};

module.exports.getUserByUsername = function (username, callback) {
    var query = {username: username};
    console.log(query);
    User.findOne(query, callback);
};

module.exports.getUser = function (username, callback) {
    var search = {username: username};
    User.findOne(search, callback);
};

module.exports.getUserById = function (id, callback) {
    console.log("the id is " + id);
    User.findById(id, callback);
};

module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword,hash, function (err,isMatch) {
        if (err) throw err;
        console.log("ismatch: " + isMatch);
        callback(null, isMatch);
    });
};