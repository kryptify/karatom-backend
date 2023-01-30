const express = require('express')
const router = express.Router();
const onboarding = require('./onboarding.js')

router.use('/onboarding', onboarding)

router.get('/', function(req, res){
  res.send('GET contract');
})

module.exports = router;