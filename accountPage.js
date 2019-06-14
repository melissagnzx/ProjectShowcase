var express = require('express');
var router =  express.Router();
var fileUpload = require('express-fileupload');
var fs = require('file-system');
var Program = require('./models/program');
var del = require('del');


var User = require('./models/user');
var sess;

/* used by every link that is covered by the accountPage
* to makes sure that you are login and are the correct person on your account. */
function loggedIn(req, res, next) {
    var str = req.url.replace('/','').split('/');
    var username = str[0];

    if (req.session) {
        if (req.session.userName === username) {
            next();
        } else {
            res.redirect('/login');
        }
    } else {

        res.redirect('/login');
    }
}

/* looks in a file to see if it contains the input function in
* python. It then returns the string in each input function. */
function checkForInput(filename) {
    var data = fs.readFileSync(filename);
    var wordsArray = data.toString().split(/\s+/);
    var input_statements = [];

    for (var i=0; i<wordsArray.length; i++) {
        if (wordsArray[i].includes('input(')) {
            var statement = wordsArray[i].substring(wordsArray[i].indexOf('input(') + 6,wordsArray[i].length).replace('\'','').replace('\"','');
            if (wordsArray[i].includes(')')) {
                statement = statement.substring(0, statement.indexOf(')')).replace('\'','').replace('\"','');
            } else {
                var offset = 1;
                var endParath = false;
                while (i+offset < wordsArray.length && !endParath) {
                    if (wordsArray[i+offset].includes(')')) {
                        endParath = true;
                        statement = statement + wordsArray[i+offset].replace(')','').replace('\'','').replace('\"','');
                    } else {
                        statement = statement + wordsArray[i+offset] + " ";
                    }
                    offset ++;
                }
            }
            input_statements.push(statement);
        }
    }
    return input_statements;
}

router.use(fileUpload());

/* handle the user's home account page */
router.get('/:username', loggedIn, function (req, res) {
    var username = req.url.replace('/',"").toString();
    User.getUser(username, function (err, user) {
        if (err) throw err;
        else if (user != null) {
            /* get all the programs for the user */
            Program.getAllProgramsByUsername(username, function(err,programs) {
                if (err) throw err;
                res.render('accountPage',{
                    user : user,
                    programs: programs
                });
            });
        }
    });
});

/* handle the logout*/
router.get('/:username/logout', loggedIn, function(req, res, next) {
    sess = req.session;
    if (sess) {
        // delete session object
        sess.destroy(function(err) {
            if(err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});

/* handle the user's page for uploading a program. */
router.get('/:username/upload', loggedIn, function (req, res) {
    //console.log('go to the account page');
    //var username = req.params.username;
    //var user = User.getUser(username);
    var username = req.url.replace('/',"").toString();
    User.getUser(username, function (err, user) {
        if (err) throw err;
        res.render('upload',{
            user : user
        });
    });
});

/* allows the user to upload a program along with a title.
* It does some security checks such as making sure the uploaded file is
* a .py file and the file doesn't import os. */
router.post('/:username/upload', function (req,res) {
    if (!req.files)
        return res.status(400).send('No files were uploaded.');

    var username = req.url.split('/')[1];
    var user = {username : username};
    var sampleFile = req.files.sampleFile;
    var progName = req.body.progName;
    var progTitle = progName;
    var bad_input = false;
    var errors;

    /* The following if statements check to see if the user filled in all the required input boxes */
    if (sampleFile != null) {
        if (sampleFile.name.indexOf(".py") === -1) {
            errors = ["Please upload a python file."];
            bad_input = true;
        }
    }
    if (sampleFile == null) {
        errors = ['Please choose a Python file.'];
        bad_input = true;
    }
    if (progName === '') {
        errors = ['Please enter a name for your program that you are uploading.'];
        bad_input = true;
    }
    if (bad_input) {
        res.render('upload',{
            user : user,
            error: errors
        });
        return;
    }

    /* remove any spaces in the name */
    progName = progName.replace(/\s+/g, '');

    /* check the program name to avoid repeated titles */
    Program.getProgramByUsername(username,progName, function (err,programDetails) {
        if (programDetails) {
            /* msg to the user! */
            req.checkBody('progName', ' please enter a different name.').equals(!progName);  //TODO:
            var errors = ['That title is already used by another one of your programs.'];
            res.render('upload',{
                user : user,
                error: errors
            });
        } else {
            var path = __dirname + '/views/Users/' + username + '/' + progName;
            fs.mkdir(path, function (err) {
                if (err) {
                    res.render('upload', {
                        user: user
                    })
                } else {
                    // Use the mv() method to place the file somewhere on the server
                    sampleFile.mv(__dirname + '/views/Users/' + username + '/' + progName + '/' + req.files.sampleFile.name, function (err) {
                        if (err)
                            return res.status(500).send(err);

                        var statements = checkForInput(path+'/'+sampleFile.name);
                        var newProg = new Program({
                            username: username,
                            programName: progName,
                            programTitle: progTitle,
                            mainProgram: sampleFile.name,
                            inputMessages: statements
                        });
                        /* look in the uploaded file for "import os". */
                        var content = fs.readFileSync(path + '/' + sampleFile.name);
                        if (err) throw err;
                        if(content.indexOf('import os') >= 0) {
                            bad_file = true;
                            errors = ["you can't upload a python file that imports os."];
                            del([path]);
                            res.render('upload',{
                                user : user,
                                error: errors
                            });
                            return;
                        }
                        /* add the programs info to the DB. */
                        Program.addProgram(newProg, function (err, newProg) {
                            if (err) console.log(err);
                            req.flash('success', 'Added Program');
                        });
                        res.redirect('/account/' + username);
                    });
                }
            });
        }
    });


});

/* handles the running of a program. */
router.get('/:username/run/:progName', loggedIn, function (req, res) {
    var list = req.url.split('/');
    var username = list[1];
    var progName = list[3];
    /* get the program from the DB via the username and the name of the program. */
    Program.getProgramByUsername(username,progName,function (err, programDetails) {
        if (err) throw err;
        if (!programDetails) {
            res.redirect('/account' + username);
        } else {
            res.render('console',{
                program : programDetails,
                username: username,
                account : true
            });
        }
    });
});

router.get('/:username/remove/:progName', loggedIn, function (req,res) {
    var list = req.url.split('/');
    var username = list[1];
    var progName = list[3];
    /* remove the program from the DB. */
    Program.removeProgram(username,progName, function(err,deleted_program){
        if (err) throw err;
        if (deleted_program === null) {
        } else {
            var path = __dirname + '/views/Users/' + username + '/' + progName;
            del([path + '/' + deleted_program.mainProgram]);
            del([path]);
        }
    });
    res.redirect('/account/' + username);
});

router.get('/', function (req, res) {
    var userSession = res.locals.session;
    res.render('home',{
        title: "Program Showcase",
        user:userSession
    });
});

module.exports = router;