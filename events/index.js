var express    = require('express');
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Events is called.');
    next();
});

router.use('/updates', require('./updates'));

module.exports = router;
