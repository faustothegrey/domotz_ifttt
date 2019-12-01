var express    = require('express');
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Action is called.');
    next();
});

router.use('/say-hello', require('./say-hello'));
router.use('/create_new_thing', require('./create_new_thing'));
router.use('/new_domotz_event_dispatched', require('./new_domotz_event_dispatched'))

module.exports = router;
