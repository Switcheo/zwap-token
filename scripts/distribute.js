const fetch = require('node-fetch')
const { BN, Long } = require('@zilliqa-js/util')
const { VERSION, zilliqa, statsURL, useKey } = require('./zilliqa')

let nonce = 0

const setRootForIndexes = (process.env.SET_ROOT_FOR_DISTRIBUTOR_INDEXES || '0').split(',')
console.log(`Setting root for indexes: ${setRootForIndexes.join(' ')}`)

async function distribute() {
  useKey(process.env.PRIVATE_KEY)
  console.log(`Sender address is: ${zilliqa.wallet.defaultAccount.address}`)
  const balance = await zilliqa.blockchain.getBalance(zilliqa.wallet.defaultAccount.address);
  console.log(`Balance is: ${balance.result.balance} ZIL\n===`)
  nonce = balance.result.nonce

  // get distributors
  const distributors = await getDistributors()
  const promises = distributors.map(async (d, i) => {
    // get current epoch
    const { emission_info: { epoch_period, initial_epoch_number, total_number_of_epochs, distribution_start_time, retroactive_distribution_cutoff_time } } = d
    const now = Math.floor(Date.now() / 1000);
    const epochNumber = Math.max(0, Math.floor((now - distribution_start_time) / epoch_period) + initial_epoch_number - 1)

    // check if started
    if (now < distribution_start_time + epoch_period && (retroactive_distribution_cutoff_time === 0 || now <= retroactive_distribution_cutoff_time)) {
      console.log(`<${d.name}> not started, skipping it.`)
      return null
    }

    // check if last epoch passed
    if (epochNumber > initial_epoch_number + total_number_of_epochs - 1) {
      console.log(`<${d.name}> ended, skipping it.`)
      return null
    }

    // check if distributed
    const contract = zilliqa.contracts.at(d.distributor_address_hex)
    const result = await contract.getSubState("merkle_roots")
    if (result.merkle_roots[epochNumber]) {
      console.log(`<${d.name}> epoch ${epochNumber} merkle root already set.`)
      return null
    }

    // generate and set merkle root
    console.log(`Generating <${d.name}> distribution for epoch ${epochNumber}`)
    return generateAndSet(i, epochNumber, d.distributor_address_hex)
  }).filter(d => !!d)

  await Promise.all(promises)

  console.log("Epoch distribution done.")
}

async function generateAndSet(id, epochNumber, distrAddress) {
  let merkleRoot = await generateEpoch(id, distrAddress)
  if (!merkleRoot) {
    console.log(`Epoch already generated for ${distrAddress}, fetching generated data`)
    merkleRoot = await getMerkleRoot(distrAddress, epochNumber)
  }
  console.log(`Merkle root for ${distrAddress} is ${merkleRoot}.`)

  // set merkle root
  if (setRootForIndexes.includes(id.toString(10))) {
    console.log(`Setting merkle root for ${distrAddress}`)
    await setMerkleRoot(epochNumber.toString(10), merkleRoot, distrAddress)
  }
  console.log(`Epoch distribution done for ${distrAddress}.`)
}

async function getMerkleRoot(distrAddress, epochNumber) {
  const response = await fetch(`${statsURL}/distribution/data/${distrAddress}/${epochNumber}`)
  const result = await response.json()
  if (result.length < 2) {
    throw new Error('Too few results for sanity check, aborting.')
  }
  const first = result[0].proof.split(' ')
  const hash = first[first.length - 1]

  if (hash.length !== 64) {
    throw new Error(`Get epoch merkle root is not a hash: ${hash}`)
  }

  // ensure all roots are the same
  for (let i = 1; i < result.length; ++i) {
    const compare = result[i].proof.split(' ')
    if (hash !== compare[compare.length - 1]) {
      throw new Error(`Root hash mismatch at index ${i}!`)
    }
  }

  return `0x${hash}`
}

async function generateEpoch(id) {
  const response = await fetch(`${statsURL}/distribution/generate/${id}`)
  const result = await response.json()
  if (result == "Epoch already generated!") {
    return null
  }
  if (result.length !== 64) {
    throw new Error(`Generate epoch result is not a hash: ${result}`)
  }
  return `0x${result}`
}

async function getDistributors() {
  const response = await fetch(`${statsURL}/distribution/info`)
  const result = await response.json()
  return result
}

async function setMerkleRoot(epochNumber, merkleRoot, distrAddress, attempt = 0) {
  try {
    console.log(`Setting merkle root with nonce: ${++nonce}`)

    const minGasPrice = (await zilliqa.blockchain.getMinimumGasPrice()).result
    const contract = zilliqa.contracts.at(distrAddress)
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
        gasLimit: Long.fromNumber(50000),
        nonce,
      },
      33,
      1000,
      true,
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
    await setMerkleRoot(epochNumber, merkleRoot, distrAddress, ++attempt)
  }
}

distribute().catch(err => {
  console.error(err)
}).then(() => {
  console.log('End of script.')
})