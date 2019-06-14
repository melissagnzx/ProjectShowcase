var mongoose = require('mongoose');

/* username: the user that owns the program.
* programName: the name of the dir where the file is stored.
* programTitle: the title for the program that the user will see.
* mainProgram: the name of the python file.
* inputMessages: an array of all the input messages located in the program.
* This can be empty if there are no input functions used in the program. */
var ProgramScheme = mongoose.Schema({
    username: {
        type: String,
        index: true
    },
    programName: {
        type: String
    },
    programTitle: {
        type: String
    },
    mainProgram: {
        type: String
    },
    inputMessages: {
        type: Array
    }
});

var Program = module.exports = mongoose.model('programs',ProgramScheme);

module.exports.addProgram = function (newProgram, callback) {
    newProgram.save(callback);
};

module.exports.getProgramByUsername = function (username, programName, callback) {
    var query = { $and: [ { username: { $eq: username } }, { programName: { $eq: programName } } ] };
    Program.findOne(query, callback);
};


module.exports.getAllProgramsByUsername = function (username, callback) {
    var query = {username: username};
    Program.find(query,callback);
};

module.exports.removeProgram = function (username, programName, callback) {
    var query = {username: username, programName: programName};
    Program.findOneAndDelete(query, callback);
};