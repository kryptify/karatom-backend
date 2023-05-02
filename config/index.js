const express = require('express')
const router = express.Router();
const Web3 = require('web3');

const { contractAddress } = require("../config.json")
const { providerURL } = require("../secrets.json")
const { readInfo, saveInfo, syncNonceForAccount } = require("../utils.js")

const web3 = new Web3(providerURL)

/**
 * GET - /config/implementation_address
 * @dev get the address of implementation smart contract of the current proxy (for dev maintenance)
 * @return returns the address of implementation smart contract
 */
router.get('/imp_address', async function(_, res) {
  try {
    let address = await web3.eth.getStorageAt(contractAddress, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")
    const response = {
      success: true,
      result: {
        address: address
      }
    }
    console.log(response);
    res.json(response)
  }
  catch (error) {
    console.log("Implementation address error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
})

/**
 * GET - /config/info
 * @dev get the details of stored info
 */
router.get('/info', async function(_, res) {
  const info = readInfo()
  const response = {
    success: true, 
    result: {
      nonce: info.nonce,
      gasLimit: info.gasLimit,
      gasPrice: info.gasPrice
    }
  }
  console.log(response)
  res.json(response)
})

/**
 * POST - /config/sync_nonce
 * @dev get the new nonce of the admin account and save it in the config file
 * @return returns the new nonce
 */
router.post('/sync_nonce', async function(_, res) {
  const nonce = await syncNonceForAccount()
  const response = {
    success: true, 
    result: {
      nonce: nonce
    }
  }
  console.log(response)
  res.json(response)
})

/**
 * POST - /config/gasprice
 * @dev set the new gas price and save it into info file
 */
router.post('/gasprice', async function(req, res) {
  const gasPrice = req.body.gasPrice
  const info = readInfo()

  saveInfo({...info, gasPrice})

  const response = {
    success: true, 
    result: {
      gasPrice: gasPrice
    }
  }
  console.log(response)
  res.json(response)
})

/**
 * POST - /config/gaslimit
 * @dev set the new gas limit and save it into info file
 */
router.post('/gaslimit', async function(req, res) {
  const gasLimit = req.body.gasLimit
  const info = readInfo()

  saveInfo({...info, gasLimit})

  const response = {
    success: true, 
    result: {
      gasLimit: gasLimit
    }
  }
  console.log(response)
  res.json(response)
})

module.exports = router;