const express = require('express')
const bodyParser = require('body-parser')

const contract = require('./contract/index.js')
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

app.use('/contract', contract)

app.listen(port);
console.log(`karatom backend started listening on port ${port}...`)

syncNonceForAccount()