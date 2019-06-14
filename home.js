var express = require('express');
var router =  express.Router();

/* home page '/' */
router.get('/', function (req, res) {
    /* render takes an .ejs file and renders it*/
    res.render('home',{
        title: "Program Showcase",
    });
});

/* so you can logout from the home page. */
router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

module.exports = router;