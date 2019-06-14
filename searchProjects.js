var express = require('express');
var router =  express.Router();
var Program = require('./models/program');
var User = require('./models/user');

/* loads the /searchProjects page. */
router.get('/', function (req, res) {
    console.log('the url ' + req.url);
    res.render('searchProjects');
});

/* searches for a user in the database that matches the username that was entered. */
router.post('/', function (req, res) {
    User.getUserByUsername(req.body.username, function (err,user) {
        if (err) throw err;
        console.log(user);
        if (user != null) {
            console.log('redirect');
            res.redirect('/user/' + user.username);
        } else {
            console.log("no match");
            res.render('searchProjects', {
                title: "Program Showcase",
                error: "No such username"
            });
        }
    });
});

/* loads some user's public account page including all their programs. */
router.get('/:username', function (req, res) {
    var username = req.url.replace('/',"").toString();
    console.log('the username ' + '\'' + username + '\'');
    if (username === '') {
        res.render('searchProjects');
    } else {
        User.getUser(username, function (err, user) {
            console.log('the user' + user);
            if (err) throw err;
            else if (user != null) {
                Program.getAllProgramsByUsername(username, function(err,programs) {
                    if (err) throw err;
                    res.render('userPage',{
                        user : user,
                        programs: programs
                    });
                });
            } else {
                res.redirect('/searchProjects');
            }
        });
    }
});

/* Runs the program from the search user's page. */
router.get('/:username/run/:progName', function (req, res) {
    var list = req.url.split('/');
    var username = list[1];
    var progName = list[3];
    Program.getProgramByUsername(username,progName,function (err, programDetails) {
        if (err) throw err;
        if (!programDetails) {
            res.redirect('/user' + username);
        } else {
            res.render('console',{
                program : programDetails,
                username: username,
                account : false
            });
        }
    });
});

module.exports = router;