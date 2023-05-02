const express = require('express')
const router = express.Router();
const Web3 = require('web3');

const { chainId, contractAddress, abi} = require("../config.json")
const { providerURL, privateKey } = require("../secrets.json")
const { readInfo, saveInfo, syncNonceForAccount } = require("../utils.js")

const web3 = new Web3(providerURL)

/**
 * GET - /transaction
 * @dev get the list of transaction with params
 * @param kind(query) the kind of the product
 * @param source(query) the source of the transaction
 * @param target(query) the target of the transaction
 * @param delivery_date(query) the delivery date of the transaction
 * @return returns the list of transactions under the params' condition
 */
router.get('/', async function(req, res){
  
  const contract = new web3.eth.Contract(abi, contractAddress)
  const { kind, source, target, delivery_date } = req.query
  
  try {
    let transactionList = await contract.methods.getTransactionList().call()
    let resultList = []

    for (let i = 0; i < transactionList.length; i++) {
      const trx = transactionList[i]
      console.log({trx})
      
      if (kind && trx.kind !== kind) {continue}
      if (source && trx.source !== source) {continue}
      if (target && trx.target !== target) {continue}
      if (delivery_date && trx.delivery_date !== delivery_date) {continue}

      resultList.push({
        transaction_id: trx.transaction_id,
        delivery_date: trx.delivery_date,
        amount: trx.amount,
        kind: trx.kind,
        source: trx.source,
        target: trx.target,
        status: trx.status,
        last_activity_date: trx.last_activity_date,
        invoice_url: trx.invoice_url,
        reserved_field: trx.reserved_field
      })
    }

    const response = {success: true, result: resultList}
    console.log(response)
    res.json(response)
  }
  catch (error) {
    console.log(`getTransactionList error: ${error}`)
    res.json({sucess: false, error: error.toString()})
  }
})

/**
 * GET - /transaction/:id
 * @dev get the details of the contract with the id
 * @param id contract id to get details of
 * @return returns the details of contract with the contract id
 */
router.get('/:id', async function(req, res){
  const { id } = req.params
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const contract = new web3.eth.Contract(abi, contractAddress)

  try {
    const trx = await contract.methods.getTransaction(id).call()
    const response = {
      success: true,
      result: {
        transaction_id: trx.transaction_id,
        delivery_date: trx.delivery_date,
        amount: trx.amount,
        kind: trx.kind,
        source: trx.source,
        target: trx.target,
        status: trx.status,
        last_activity_date: trx.last_activity_date,
        invoice_url: trx.invoice_url,
        reserved_field: trx.reserved_field
      }
    }
    console.log(response)
    res.json(response)
  }
  catch (error) {
    console.log("getTransaction error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
})

/**
 * POST - /transaction
 * @dev Create a new transaction
 * @param transaction_id(body) id of the transaction to create
 * @param delivery_date(body) delivery date of the transaction
 * @param amount(body) amount of the transaction
 * @param kind(body) kind of the product
 * @param source(body) source of the transaction
 * @param target(body) target of the transaction
 * @param last_activity_date(body) last date of activity of the transaction
 * @param invoice_url(body) url of the invoice of the transaction
 * @param reserved_field(body) reserved field of the transaction
 * @return returns the details of the new transaction
 */
router.post('/', async function(req, res){
  const { 
    transaction_id,
    delivery_date,
    amount,
    kind,
    source,
    target,
    last_activity_date,
    invoice_url,
    reserved_field
  } = req.body

  const contract = new web3.eth.Contract(abi, contractAddress)
  const transaction = contract.methods.createTransaction(
    transaction_id,
    delivery_date,
    amount,
    kind,
    source,
    target,
    last_activity_date,
    invoice_url,
    reserved_field
  )
  const encodedABI = transaction.encodeABI()

  const info = readInfo()

  const options = {
    nonce: info.nonce.toString(),
    chainId: chainId.toString(),
    to: transaction._parent._address,
    gas: info.gasLimit,
    gasPrice: info.gasPrice,
    data: encodedABI
  }

  const signed = await web3.eth.accounts.signTransaction(options, privateKey)

  saveInfo({...info, nonce: info.nonce+1})

  let responded = false
  contract.once("TransactionReserved", function(error, event) {
    if (responded) {
      return
    }
    if (error) {
      console.log("TransactionReserved error: " + error)
      res.json({sucess: false, error: error.toString()})
      responded = true
      return
    }
    const { 
      transaction_id, 
      amount,
      kind,
      source,
      target,
      last_activity_date
    } = event.returnValues
    
    const response = {
      success: true,
      result: {
        transaction_id: transaction_id,
        amount: amount,
        kind: kind,
        source: source,
        target: target,
        last_activity_date: last_activity_date
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
    console.log("createTransaction error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
  responded = true
})

/**
 * POST - /transaction/transport
 * @dev To update the transaction status as transporting
 * @param transaction_id(body) identifier of the transaction
 * @param last_activity_date(body) last date of activity of the transaction
 */
router.post('/transport', async function(req, res){
  const { transaction_id, last_activity_date } = req.body

  const contract = new web3.eth.Contract(abi, contractAddress)
  const transaction = contract.methods.transportTransaction(transaction_id, last_activity_date)
  const encodedABI = transaction.encodeABI()

  const info = readInfo()

  const options = {
    nonce: info.nonce.toString(),
    chainId: chainId.toString(),
    to: transaction._parent._address,
    gas: info.gasLimit,
    gasPrice: info.gasPrice,
    data: encodedABI
  }

  const signed = await web3.eth.accounts.signTransaction(options, privateKey)

  saveInfo({...info, nonce: info.nonce+1})

  let responded = false
  contract.once("TransactionTransporting", function(error, event) {
    if (responded) {
      return
    }
    if (error) {
      console.log("TransactionTransporting error: " + error)
      res.json({sucess: false, error: error.toString()})
      responded = true
      return
    }
    const {
      transaction_id,
      amount,
      kind,
      source,
      target,
      last_activity_date
    } = event.returnValues
    const response = {
      success: true,
      result: {
        transaction_id: transaction_id,
        amount: amount,
        kind: kind,
        source: source,
        target: target,
        last_activity_date: last_activity_date
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
    console.log("transportTransaction error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
  responded = true
})

/**
 * POST - /transaction/complete
 * @dev To update the transaction status as completed
 * @param transaction_id(body) the identifier of transaction to be completed
 * @param last_activity_date(body) the date of last activity
 * @param invoice_url(body) url of the transaction invoice
 * @param reserved_field(body) reserved for later use
 */
router.post('/complete', async function(req, res){
  const {
    transaction_id,
    last_activity_date,
    invoice_url,
    reserved_field
  } = req.body

  const contract = new web3.eth.Contract(abi, contractAddress)
  const transaction = contract.methods.completeTransaction(
    transaction_id,
    last_activity_date,
    invoice_url,
    reserved_field
  )
  const encodedABI = transaction.encodeABI()

  const info = readInfo()

  const options = {
    nonce: info.nonce.toString(),
    chainId: chainId.toString(),
    to: transaction._parent._address,
    gas: info.gasLimit,
    gasPrice: info.gasPrice,
    data: encodedABI
  }

  const signed = await web3.eth.accounts.signTransaction(options, privateKey)

  saveInfo({...info, nonce: info.nonce+1})

  let responded = false
  contract.once("TransactionCompleted", function(error, event) {
    if (responded) {
      return
    }
    if (error) {
      console.log("TransactionCompleted error: " + error)
      res.json({sucess: false, error: error.toString()})
      responded = true
      return
    }
    const {
      transaction_id,
      amount,
      kind,
      source,
      target,
      last_activity_date,
      invoice_url,
      reserved_field
    } = event.returnValues

    const response = {
      success: true,
      result: {
        transaction_id: transaction_id,
        amount: amount,
        kind: kind,
        source: source,
        target: target,
        last_activity_date: last_activity_date,
        invoice_url: invoice_url,
        reserved_field: reserved_field
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
    console.log("completeTransaction error: " + error)
    res.json({sucess: false, error: error.toString()})
  }
  responded = true
})

module.exports = router;