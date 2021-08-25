const fetch = require('node-fetch')
const { BN, Long } = require('@zilliqa-js/util')
const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto')
const { VERSION, zilliqa, network } = require('./zilliqa')

const network = process.env.NETWORK || 'localhost'

function getContractAddress() {
  switch (network) {
    case 'mainnet': return '0xca6d3f56218aaa89cd20406cf22aee26ba8f6089'
    case 'testnet': return '0x55fc7c40cc9d190aad1499c00102de0828c06d41'
    case 'localhost': return ''
    default: throw new Error('Invalid network')
  }
}

const privateKey = process.env.PRIVATE_KEY
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
  await setMerkleRoot((epochNumber - 1).toString(), result)

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

async function setMerkleRoot(epochNumber, merkleRoot, attempt = 0) {
  try {
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
  } catch (err) {
    console.error(err)
    if (attempt > 9) {
      console.log("Failed to set merkle root, giving up.")
      throw err
    }
    console.log("Failed to set merkle root, retrying.")
    await setMerkleRoot(epochNumber, merkleRoot, ++attempt)
  }
}

distribute().catch(err => {
  console.error(err)
}).then(() => {
  console.log('End of script.')
})
