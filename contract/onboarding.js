const express = require('express')
const router = express.Router();
const Web3 = require('web3');

const { providerURL, chainId, karatomContractAddress, karatomABI, gasLimit, gasPrice } = require("../config.json")
const { privateKey } = require("../secrets.json")
const { readInfo, saveInfo } = require("../utils.js")

const web3 = new Web3(providerURL)

// router.use('/*', async function(_, res, next){
//   try {
//     const isListening = await web3.eth.net.isListening();
//     if (!isListening) {
//       const response = {success: false, error: "web3 not connected"}
//       console.log(response)
//       res.json(response)  
//     }
//     else {
//       next()
//     }
//   }
//   catch (error) {
//     const response = {success: false, error: "web3 not connected"}
//     console.log(response)
//     res.json(response)
//   }
// })

/**
 * GET - /contract/onboarding
 * @dev get the list of onboarding contracts with params
 * @param withStatus(query) the status of the contracts to get
 * @param withoutStatus(query) the status of the contracts not to get
 * @return returns the list of onboarding contracts under the params' condition
 */
router.get('/', async function(req, res){
  
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  const { withStatus, withoutStatus } = req.query
  let functionName
  try {
    let contractList
    if (withStatus) {
      functionName = "getOnboardingContractListWithStatus"
      contractList = await contract.methods.getOnboardingContractListWithStatus(withStatus).call({ from: account.address })
    }
    else if (withoutStatus) {
      functionName = "getOnboardingContractListWithoutStatus"
      contractList = await contract.methods.getOnboardingContractListWithoutStatus(withoutStatus).call({ from: account.address })
    }
    else {
      functionName = "getOnboardingContractList"
      contractList = await contract.methods.getOnboardingContractList().call({ from: account.address })
    }
    
    const responseList = contractList.map((contract_) => {
      return {
        id: contract_.id_,
        farmerId: contract_.farmerId,
        documentURL: contract_.documentURL,
        status: contract_.status,
        createdTime: contract_.createdTime,
        officialTime: contract_.officialTime,
        closedTime: contract_.closedTime
      }
    })
    const response = {success: true, result: responseList}
    console.log(response)
    res.json(response)
  }
  catch (error) {
    console.log(`${functionName} error: ${error}`)
    res.json({sucess: false, error: error.toString()})
  }
})

/**
 * GET - /contract/onboarding/count
 * @dev get the count of onboarding contracts with params
 * @param status(query) the status of the contracts to get
 * @return returns the count of onboarding contracts with the status under the params' condition,
 * if there is no status in query params, it will return the count of all onboarding contracts
 */
router.get('/count', async function(req, res){
  
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  let { status } = req.query
  let functionName
  try {
    let contractCount;
    if (status) {
      functionName = "getOnboardingContractCountWithStatus"
      contractCount = await contract.methods.getOnboardingContractCountWithStatus(status).call({ from: account.address })
    }
    else {
      functionName = "getOnboardingContractCount"
      contractCount = await contract.methods.getOnboardingContractCount().call({ from: account.address })
    }
    
    const response = {success: true, result: contractCount}
    console.log(response)
    res.json(response)
  }
  catch (error) {
    console.log(`${functionName} error: ${error}`)
    res.json({sucess: false, error: error.toString()})
  }
})

/**
 * GET - /contract/onboarding/:id
 * @dev get the details of the contract with the id
 * @param id contract id to get details of
 * @return returns the details of contract with the contract id
 */
router.get('/:id', async function(req, res){
  const { id } = req.params
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)

  try {
    const contract_ = await contract.methods.getOnboardingContract(id).call({ from: account.address })
    const response = {
      success: true,
      result: {
        id: contract_.id_,
        farmerId: contract_.farmerId,
        documentURL: contract_.documentURL,
        status: contract_.status,
        createdTime: contract_.createdTime,
        officialTime: contract_.officialTime,
        closedTime: contract_.closedTime
      }
    }
    console.log(response)
    res.json(response)
  }
  catch (error) {
    console.log("getOnboardingContract error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
})

/**
 * POST - /contract/onboarding
 * @dev Create a new onboarding contract
 * @param farmerId(body) farmer's id of the onboarding contract
 * @param documentURL(body) onboarding contract document's url
 * @return returns the details of the new contract
 */
router.post('/', async function(req, res){
  const { farmerId, documentURL } = req.body

  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  const transaction = contract.methods.generateOnboardingContract(farmerId, documentURL)
  const encodedABI = transaction.encodeABI()

  const { nonce } = readInfo()

  const options = {
    nonce: nonce.toString(),
    chainId: chainId.toString(),
    to: transaction._parent._address,
    gas: gasLimit,
    gasPrice: gasPrice,
    data: encodedABI
  }

  const signed = await web3.eth.accounts.signTransaction(options, privateKey)

  saveInfo({nonce: nonce + 1})

  let responded = false
  contract.once("OnboardingContractCreated", function(error, event) {
    if (responded) {
      return
    }
    if (error) {
      console.log("OnboardingContractCreated error: " + error)
      res.json({sucess: false, error: error.toString()})
      responded = true
      return
    }
    const { id, farmerId, documentURL, createdTime } = event.returnValues
    const response = {
      success: true,
      result: {
        id: id.toString(),
        farmerId: farmerId.toString(),
        documentURL: documentURL.toString(),
        createdTime: createdTime.toString()
      }
    }
    console.log(response)
    res.json(response)
    responded = true
  })

  try {
    await web3.eth.sendSignedTransaction(signed.rawTransaction)
  }
  catch (error) {
    console.log("generateOnboardingContract error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
  responded = true
})

/**
 * POST - /contract/onboarding/sign
 * @dev To update the contract status as official
 * @param contractId(body) contract id to sign
 * @param documentURL(body) the url of the signed document
 */
router.post('/sign', async function(req, res){
  const { contractId, documentURL } = req.body

  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  const transaction = contract.methods.signOnboardingContract(contractId, documentURL)
  const encodedABI = transaction.encodeABI()

  const { nonce } = readInfo()

  const options = {
    nonce: nonce.toString(),
    chainId: chainId.toString(),
    to: transaction._parent._address,
    gas: gasLimit,
    gasPrice: gasPrice,
    data: encodedABI
  }

  const signed = await web3.eth.accounts.signTransaction(options, privateKey)

  saveInfo({nonce: nonce + 1})

  let responded = false
  contract.once("OnboardingContractOfficial", function(error, event) {
    if (responded) {
      return
    }
    if (error) {
      console.log("OnboardingContractOfficial error: " + error)
      res.json({sucess: false, error: error.toString()})
      responded = true
      return
    }
    const contractId_ = event.returnValues.id
    const documentURL_ = event.returnValues.documentURL
    const officialTime = event.returnValues.officialTime
    const response = {
      success: true,
      result: {
        contractId: contractId_.toString(),
        documentURL: documentURL_.toString(),
        officialTime: officialTime.toString()
      }
    }
    console.log(response)
    res.json(response)
    responded = true
  })

  try {
    await web3.eth.sendSignedTransaction(signed.rawTransaction)
  }
  catch (error) {
    console.log("signOnboardingContract error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
  responded = true
})

/**
 * POST - /contract/onboarding/close
 * @dev To update the contract status as closed
 * @param contractId(body) contract id to close
 */
router.post('/close', async function(req, res){
  const { contractId } = req.body

  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  const transaction = contract.methods.closeOnboardingContract(contractId)
  const encodedABI = transaction.encodeABI()

  const { nonce } = readInfo()

  const options = {
    nonce: nonce.toString(),
    chainId: chainId.toString(),
    to: transaction._parent._address,
    gas: gasLimit,
    gasPrice: gasPrice,
    data: encodedABI
  }

  const signed = await web3.eth.accounts.signTransaction(options, privateKey)

  saveInfo({nonce: nonce + 1})

  let responded = false
  contract.once("OnboardingContractClosed", function(error, event) {
    if (responded) {
      return
    }
    if (error) {
      console.log("OnboardingContractClosed error: " + error)
      res.json({sucess: false, error: error.toString()})
      responded = true
      return
    }
    const contractId_ = event.returnValues.id
    const closedTime = event.returnValues.closedTime
    const response = {
      success: true,
      result: {
        contractId: contractId_.toString(),
        closedTime: closedTime.toString()
      }
    }
    console.log(response)
    res.json(response)
    responded = true
  })

  try {
    await web3.eth.sendSignedTransaction(signed.rawTransaction)
  }
  catch (error) {
    console.log("closeOnboardingContract error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
  responded = true
})

module.exports = router;