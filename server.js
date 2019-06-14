/* run in the terminal: npm init
 *the --save flag adds it to the .json file
 * npm install ejs --save
 * npm install express-validator --save
  * maybe we should do mongodb
  * if so we should check out mongojs -> npm install mongojs --save */

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
/* This is used to validate the user input.
 * this requires some middle ware */
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/codex');

var home = require('./home');
var users = require('./users');
var projects = require('./projects');
var login = require('./login');
var accountPage = require("./accountPage");
var search = require('./searchProjects');
var about = require('./about');
var help = require('./help');

var IGNORE = '5qFcRqWexG5uuqDiWeRHCPEvECYmDDUxzbAM1zNK';

var app = express();



/* this is middle ware and it is used to preform a task
 * in between the request and the response.
 * it has access to both the request and the response and
 * it will run every time the application is loaded.
*/
/* View Engine */
app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'));
app.engine('html', require('ejs').renderFile); /* allows us to use ejs */

/* Body Parser Middleware*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

/* Set Static Path to templates which is where the html/css is. */
app.use(express.static(path.join(__dirname,'views')));

/* define a session to use for logged in users. */
app.use(session({
    name: 'yummy_cookie',
    secret: IGNORE,
    saveUninitialized: false,
    resave: false,
    cookie: {
        httpOnly: true,
        secure: false, // make sure to put true when HTTPS in up!!!!
        maxAge: 1000 * 60 * 60 * 24 * 7  // 7 days
    }
}));

/* Passport init used for login */
app.use(passport.initialize());
app.use(passport.session());

/* Express validator error formatter. */
app.use(expressValidator());

app.use(flash());

/* global variables */
app.use(function (req,res,next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.session = req.session;
    next();
});

/* the files that are responsible for the different urls on the site. */
app.use('/', home);
app.use('/createAccount', users);
app.use('/projectsPage', projects);
app.use('/login', login);
app.use('/account', accountPage);
app.use('/user', search);
app.use('/about', about);
app.use('/help', help);
app.use('/searchProjects', search);

/* start the server up */
app.listen(8000,function () {
    console.log('Server Started on Port 8000...');
});

/* the error page that comes up if there is an invalid url. */
app.use(function (req, res, next) {
    res.status(404).render('404.ejs');
});


