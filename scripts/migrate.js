// Step 1: remove minter
// Step 2: deploy new legacy distributor
// Step 3: run migrate transition
// Step 4: check data
// Step 5: add minter

const { BN, Long } = require('@zilliqa-js/util');
const { VERSION, zilliqa, useKey } = require('./zilliqa')

async function migrate(privateKey, legacyAddress, newAddress, minEpoch, maxEpoch) {
  useKey(privateKey)
  const minGasPrice = (await zilliqa.blockchain.getMinimumGasPrice()).result
  const newContract = zilliqa.contracts.at(newAddress)
  const balance = await zilliqa.blockchain.getBalance(zilliqa.wallet.defaultAccount.address);
  console.log({ nonce: balance.result.nonce, minGasPrice })
  const nonce = balance.result.nonce + 1

  const promises = []
  for (let epoch = minEpoch; epoch <= maxEpoch; ++epoch) {
    promises.push(new Promise(async (resolve) => {
      console.log(`Sending tx for epoch ${epoch}, nonce: ${nonce + epoch - minEpoch}`)
      const tx = await newContract.call(
        'MigrateData',
        [
          {
            vname: 'legacy_contract',
            type: 'ByStr20',
            value: legacyAddress
          },
        ],
        {
          version: VERSION,
          amount: new BN(0),
          gasPrice: new BN(minGasPrice),
          gasLimit: Long.fromNumber(33000),
          nonce: nonce + epoch - minEpoch,
        },
        33,
        1000,
        false,
      )
      resolve(tx)
    }))
  }
  const results = await Promise.all(promises).catch(err => console.error(err))
  console.log({results})

  for (let i = 0; i < results.length; ++i) {
    const migrateTx = results[i]
    if (!migrateTx.receipt || !migrateTx.receipt.success) {
      console.log(JSON.stringify(migrateTx.receipt, null, 4))
      throw new Error(`Failed to migrate data for epoch ${minEpoch + i}`)
    }
  }

  const revokeTx = newContract.call(
    'RevokeOwnership', [],
    {
      version: VERSION,
      amount: new BN(0),
      gasPrice: new BN(minGasPrice),
      gasLimit: Long.fromNumber(10000),
    },
    33,
    1000,
    false,
  )
  if (!revokeTx.receipt || !revokeTx.receipt.success) {
    console.log(JSON.stringify(revokeTx.receipt, null, 4))
    throw new Error('Failed to revoke ownership')
  }

  const state = await newContract.getState()
  console.log(`New contract state:\n${JSON.stringify(state, null, 2)}`)
}

migrate(
  process.env.PRIVATE_KEY,
  process.env.LEGACY_CONTRACT,
  process.env.NEW_CONTRACT,
  parseInt(process.env.MIN_EPOCH || 0, 10),
  parseInt(process.env.MAX_EPOCH, 10)
)
