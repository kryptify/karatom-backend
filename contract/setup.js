const express = require('express')
const router = express.Router();
const Web3 = require('web3');

const { karatomContractAddress } = require("../config.json")
const { providerURL } = require("../secrets.json")
const { syncNonceForAccount } = require("../utils.js")

const web3 = new Web3(providerURL)

/**
 * GET - /contract/setup/implementation_address
 * @dev get the address of implementation smart contract of the current proxy (for dev maintenance)
 * @return returns the address of implementation smart contract
 */
router.get('/imp_address', async function(_, res) {
  try {
    let address = await web3.eth.getStorageAt(karatomContractAddress, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")
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
    console.log("implementation error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
})

/**
 * POST - /contract/setup/sync_nonce
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

module.exports = router;