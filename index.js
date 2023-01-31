const express = require('express')
const bodyParser = require('body-parser')
const Web3 = require('web3');

const contract = require('./contract/contract.js')
const { port, providerURL } = require("./config.json")
const { privateKey } = require("./secrets.json")
const { saveInfo } = require('./utils.js')

const app = express()
const web3 = new Web3(providerURL)

app.use('*', function(req, res, next){
  console.log(`Endpoint: ${req.originalUrl}, Method: ${req.method}`)
  next()
})

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use('/contract', contract)

app.post('/sync_nonce', async function(req, res) {

  // try {
  //   const isListening = await web3.eth.net.isListening();
  //   if (!isListening) {
  //     const response = {success: false, error: "web3 not connected"}
  //     console.log(response)
  //     res.json(response)
  //     return
  //   }
  // }
  // catch (error) {
  //   const response = {success: false, error: "web3 not connected"}
  //   console.log(response)
  //   res.json(response)
  //   return
  // }

  const nonce = await syncNonceForAccount()
  const response = {success: true, nonce: nonce}
  console.log(response)
  res.json(response)
})

app.listen(port);
console.log(`karatom backend started listening on port ${port}...`)

syncNonceForAccount()
  // .then(() => {
  //   app.listen(port);
  //   console.log(`karatom backend started listening on port ${port}...`)
  // })

async function syncNonceForAccount() {
  console.log("synchronizing nonce...")
  const account = web3.eth.accounts.privateKeyToAccount(privateKey)
  const nonce = await web3.eth.getTransactionCount(account.address)
  saveInfo({nonce: nonce})
  console.log("synchronized. nonce is " + nonce)
  return nonce
}