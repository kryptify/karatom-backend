const express = require('express')
const router = express.Router();
const setup = require('./setup.js')
const onboarding = require('./onboarding.js')
const product = require('./product.js')

router.use('/setup', setup)
router.use('/onboarding', onboarding)
router.use('/product', product)

module.exports = router;