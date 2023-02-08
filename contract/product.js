const express = require('express')
const router = express.Router();
const Web3 = require('web3');

const { chainId, karatomContractAddress, karatomABI, gasLimit, gasPrice } = require("../config.json")
const { providerURL, privateKey } = require("../secrets.json")
const { readInfo, saveInfo } = require("../utils.js")

const web3 = new Web3(providerURL)

/**
 * GET - /contract/product
 * @dev get the list of product contracts with params
 * @param type(query) the type of the contracts to get
 * @param status(query) the status of the contracts to get
 * @return returns the list of product contracts under the params' condition
 * @note it does not retrieve product contracts only with status filter
 */
router.get('/', async function(req, res){
  
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  const { type, status } = req.query
  let functionName
  try {
    let contractList
    if (type && status) {
      functionName = "getProductContractListWithTypeStatus"
      contractList = await contract.methods.getProductContractListWithTypeStatus(type, status).call({ from: account.address })
    }
    else if (type) {
      functionName = "getProductContractListWithType"
      contractList = await contract.methods.getProductContractListWithType(type).call({ from: account.address })
    }
    else if (status) {
      const issue = "it can't retrieve product contracts with only status"
      const response = {success: false, error: issue}
      console.log(response)
      res.json(response)
      return
    }
    else {
      functionName = "getProductContractList"
      contractList = await contract.methods.getProductContractList().call({ from: account.address })
    }
    
    const responseList = contractList.map((contract_) => {
      return {
        id: contract_.id_,
        initiatorId: contract_.initiatorId,
        partnerId: contract_.partnerId,
        contractType: contract_.contractType,
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
 * GET - /contract/product/count
 * @dev get the count of product contracts with params
 * @param type(query) the type of the contracts to get
 * @param status(query) the status of the contracts to get
 * @return returns the count of product contracts under the params' condition,
 * @note it does not retrieve the count of product contracts only with status filter
 */
router.get('/count', async function(req, res){
  
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  let { type, status } = req.query
  let functionName
  try {
    let contractCount;
    if (type && status) {
      functionName = "getProductContractCountWithTypeStatus"
      contractCount = await contract.methods.getProductContractCountWithTypeStatus(type, status).call({ from: account.address })
    }
    else if (type) {
      functionName = "getProductContractCountWithType"
      contractCount = await contract.methods.getProductContractCountWithType(type).call({ from: account.address })
    }
    else {
      functionName = "getProductContractCount"
      contractCount = await contract.methods.getProductContractCount().call({ from: account.address })
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
 * GET - /contract/product/:id
 * @dev get the details of the contract with the id
 * @param id contract id to get details of
 * @return returns the details of contract with the contract id
 */
router.get('/:id', async function(req, res){
  const { id } = req.params
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)

  try {
    const contract_ = await contract.methods.getProductContract(id).call({ from: account.address })
    const response = {
      success: true,
      result: {
        id: contract_.id_,
        initiatorId: contract_.initiatorId,
        partnerId: contract_.partnerId,
        contractType: contract_.contractType,
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
    console.log("getProductContract error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
})

/**
 * POST - /contract/product
 * @dev Create a new product contract
 * @param initiatorId(body) id of the user who initiate the product contract
 * @param partnerId(body) id of the user who agrees the product contract
 * @param contractType(body) id of the contract type
 * @param documentURL(body) the url of the contract document
 * @return returns the details of the new contract
 */
router.post('/', async function(req, res){
  const { initiatorId, partnerId, contractType, documentURL } = req.body

  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  const transaction = contract.methods.generateProductContract(initiatorId, partnerId, contractType, documentURL)
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
  contract.once("ProductContractCreated", function(error, event) {
    if (responded) {
      return
    }
    if (error) {
      console.log("ProductContractCreated error: " + error)
      res.json({sucess: false, error: error.toString()})
      responded = true
      return
    }
    const { id, initiatorId, partnerId, contractType, documentURL, createdTime } = event.returnValues
    const response = {
      success: true,
      result: {
        id: id.toString(),
        initiatorId: initiatorId.toString(),
        partnerId: partnerId.toString(),
        contractType: contractType.toString(),
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
    console.log("generateProductContract error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
  responded = true
})

/**
 * POST - /contract/product/sign
 * @dev To update the contract status as official
 * @param contractId(body) contract id to sign
 * @param documentURL(body) the url of the signed document
 */
router.post('/sign', async function(req, res){
  const { contractId, documentURL } = req.body

  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  const transaction = contract.methods.signProductContract(contractId, documentURL)
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
  contract.once("ProductContractOfficial", function(error, event) {
    if (responded) {
      return
    }
    if (error) {
      console.log("ProductContractOfficial error: " + error)
      res.json({sucess: false, error: error.toString()})
      responded = true
      return
    }
    const contractId_ = event.returnValues.id
    const contractType = event.returnValues.contractType
    const documentURL_ = event.returnValues.documentURL
    const officialTime = event.returnValues.officialTime
    const response = {
      success: true,
      result: {
        contractId: contractId_.toString(),
        contractType: contractType.toString(),
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
    console.log("signProductContract error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
  responded = true
})

/**
 * POST - /contract/product/close
 * @dev To update the contract status as closed
 * @param contractId(body) contract id to close
 */
router.post('/close', async function(req, res){
  const { contractId } = req.body

  const contract = new web3.eth.Contract(karatomABI, karatomContractAddress)
  const transaction = contract.methods.closeProductContract(contractId)
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
  contract.once("ProductContractClosed", function(error, event) {
    if (responded) {
      return
    }
    if (error) {
      console.log("ProductContractClosed error: " + error)
      res.json({sucess: false, error: error.toString()})
      responded = true
      return
    }
    const contractId_ = event.returnValues.id
    const contractType = event.returnValues.contractType
    const closedTime = event.returnValues.closedTime
    const response = {
      success: true,
      result: {
        contractId: contractId_.toString(),
        contractType: contractType.toString(),
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
    console.log("closeProductContract error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
  responded = true
})

module.exports = router;