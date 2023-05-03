const express = require('express')
const bodyParser = require('body-parser')
const https = require('https')
const fs = require('fs')

const transaction = require('./transaction/index.js')
const config = require('./config/index.js')

const { port } = require("./config.json")
const { syncNonceForAccount } = require('./utils.js')

const app = express()

app.use('*', function(req, _, next){
  console.log(`Endpoint: ${req.originalUrl}, Method: ${req.method}`)
  next()
})

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/transaction', transaction)
app.use('/config', config)

// const options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/directvalue.com/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/directvalue.com/cert.pem'),
//   ca: fs.readFileSync('/etc/letsencrypt/live/directvalue.com/chain.pem')
// }

// https.createServer(options, app).listen(port)

app.listen(port)
console.log(`HerbalMining backend started listening on port ${port}...`)

syncNonceForAccount()