const { BN, Long, bytes, units } = require('@zilliqa-js/util')
const { Zilliqa } = require('@zilliqa-js/zilliqa')
const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto')
const fetch = require('node-fetch')

const network = process.env.NETWORK || 'localhost'

function getZilliqaURL() {
  switch (network) {
    case 'mainnet': return 'https://api.zilliqa.com'
    case 'testnet': return 'https://dev-api.zilliqa.com'
    case 'localhost': return 'https://dev-api.zilliqa.com'
    default: throw new Error('Invalid network')
  }
}

function getChainId() {
  switch (network) {
    case 'mainnet': return 1
    case 'testnet': return 333
    case 'localhost': return 333
    default: throw new Error('Invalid network')
  }
}

function getStatsURL() {
  switch (network) {
    case 'mainnet': return 'https://stats.zilswap.org'
    case 'testnet': return 'https://test-stats.zilswap.org'
    case 'localhost': return 'http://localhost:3000'
    default: throw new Error('Invalid network')
  }
}

function getContractAddress() {
  switch (network) {
    case 'mainnet': return '0xca6d3f56218aaa89cd20406cf22aee26ba8f6089'
    case 'testnet': return '0x3fba5482e459ae8cc61143f5dca3f3b44e59e07b'
    case 'localhost': return '0x3fba5482e459ae8cc61143f5dca3f3b44e59e07b'
    default: throw new Error('Invalid network')
  }
}

const zilliqa = new Zilliqa(getZilliqaURL())
const VERSION = bytes.pack(getChainId(), 1)

const privateKey = process.env.PRIVATE_KEY
zilliqa.wallet.addByPrivateKey(privateKey)
const address = getAddressFromPrivateKey(privateKey)
console.log(`Address is: ${address}`)

async function distribute() {
  // try to generate
  const result = await generateEpoch()
  if (!result) {
    console.log("No new epoch to distribute.")
    return
  }
  // get current epoch
  const epochNumber = await getCurrentEpoch()
  // set merkle root
  setMerkleRoot((epochNumber - 1).toString(), result)

  console.log("Epoch distribution done.")
}

async function generateEpoch() {
  const response = await fetch(`${getStatsURL()}/epoch/generate`)
  const result = await response.json()
  if (result == "Epoch already generated!") {
    return null
  }
  if (result.length !== 64) {
    throw new Error(`Generate epoch result is not a hash: ${result}`)
  }
  return `0x${result}`
}

async function getCurrentEpoch() {
  const response = await fetch(`${getStatsURL()}/epoch/info`)
  const result = await response.json()
  return result.current_epoch
}

async function setMerkleRoot(epochNumber, merkleRoot) {
  const balance = (await zilliqa.blockchain.getBalance(address)).result.balance
  console.log(`Setting merkle root, zil balance is: ${balance}`)

  const minGasPrice = (await zilliqa.blockchain.getMinimumGasPrice()).result
  const contract = zilliqa.contracts.at(getContractAddress())
  const callTx = await contract.call(
    'SetMerkleRoot',
    [
      {
        vname: 'epoch_number',
        type: 'Uint32',
        value: epochNumber
      },
      {
        vname: 'merkle_root',
        type: 'ByStr32',
        value: merkleRoot
      },
    ],
    {
      version: VERSION,
      amount: new BN(0),
      gasPrice: new BN(minGasPrice),
      gasLimit: Long.fromNumber(25000),
    },
    33,
    1000,
    false,
  )

  if (!callTx.receipt || !callTx.receipt.success) {
    console.log(JSON.stringify(callTx.receipt, null, 4))
    throw new Error('Failed to set merkle root')
  }

  console.log('Merkle root set.')
}

distribute()
