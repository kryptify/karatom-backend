const fs = require('fs')
const Web3 = require('web3');

const { privateKey, providerURL } = require("./secrets.json")

const web3 = new Web3(providerURL)

const saveInfo = (info) => {
  const data = JSON.stringify(info)
  try {
    fs.writeFileSync('info.dat', data)
  }
  catch (err) {
    console.log(`Error saving info file: ${err}`)
  }
}

const readInfo = () => {
  try {
    const data = fs.readFileSync('info.dat', 'utf-8')
    const info = JSON.parse(data)
    return info
  }
  catch (err) {
    console.log(`Error reading info file: ${err}`)
  }
}

const syncNonceForAccount = async () => {
  console.log("synchronizing nonce...")
  const account = web3.eth.accounts.privateKeyToAccount(privateKey)
  const nonce = await web3.eth.getTransactionCount(account.address)
  saveInfo({nonce: nonce})
  console.log("synchronized. nonce is " + nonce)
  return nonce
}

module.exports = { saveInfo, readInfo, syncNonceForAccount };