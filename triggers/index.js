var express    = require('express');
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Trigger is called.');
    next();
});

router.use('/my_trigger', require('./my-trigger'));
router.use('/new_thing_created', require('./new_thing_created'));
router.use('/new_domotz_event', require('./new_domotz_event'))

module.exports = router;
