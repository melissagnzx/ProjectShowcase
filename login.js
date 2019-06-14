var express = require('express');
var router =  express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('./models/user');

router.get('/', function (req, res) {
    console.log(req.url);
    /*if (req.url.slice(-1) === '/') {
        res.render('404.ejs');
        return;
    }*/
    res.render('login',{
        title: "User login"
    });
});

/* checks in the DB for a match for the given username and password. */
passport.use(new LocalStrategy(
    function(username, password, done) {
        User.getUserByUsername(username, function (err,user) {
            if (err) throw err;
            if (!user){ /* no account with that username. */
                return done(null,false,{message: 'Unknown User'})
            }
            User.comparePassword(password, user.password, function (err, isMatch) {
                if (err)
                    throw err;
                if (isMatch) { /* the correct password has been received for the user's account. */
                    return done(null,user);
                } else { /* incorrect password. */
                    return done(null, false, {message: 'Invalid password'});
                }
            });
        });
    }));

/* used to create the cookies. */
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

/* used to the cookies. */
passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});

/* the user posts their credentials which are checked to see if there is a match for them. */
router.post('/',
    passport.authenticate('local', {failureRedirect:'/login',failureFlash: true}),
    function (req,res) {
        /* create the session (cookie) */
        if (!req.session.userName && !req.session.visitCount) {
            req.session.userName = req.body.username;
            req.session.visitCount = 1;
        } else {
            req.session.visitCount += 1;
        }
        res.redirect('/account/' + req.body.username);
    });

module.exports = router;