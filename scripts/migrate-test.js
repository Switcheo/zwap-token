// Step 1: remove minter
// Step 2: deploy new legacy distributor
// Step 3: run migrate transition
// Step 4: check data
// Step 5: add minter

const { BN, Long } = require('@zilliqa-js/util');
const { VERSION, zilliqa, useKey } = require('./zilliqa')

async function test(privateKey, legacyAddress, newAddress) {
  useKey(privateKey)
  const minGasPrice = (await zilliqa.blockchain.getMinimumGasPrice()).result
  const legacyContract = zilliqa.contracts.at(legacyAddress)
  const callTx = await legacyContract.call(
    'SetMerkleRoot',
    [
      {
        vname: 'epoch_number',
        type: 'Uint32',
        value: '0',
      },
      {
        vname: 'merkle_root',
        type: 'ByStr32',
        value: '0x0123456789012345678901234567890123456789012345678901234567890123'
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

  const newContract = zilliqa.contracts.at(newAddress)
  const migrateTx = await newContract.call(
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
      gasLimit: Long.fromNumber(100000),
    },
    33,
    1000,
    false,
  )
  if (!migrateTx.receipt || !migrateTx.receipt.success) {
    console.log(JSON.stringify(migrateTx.receipt, null, 4))
    throw new Error('Failed to migrate data')
  }

  const state = await newContract.getState()
  console.log(`New contract state:\n${JSON.stringify(state, null, 2)}`)
}

test(
  process.env.PRIVATE_KEY,
  process.env.LEGACY_CONTRACT,
  process.env.NEW_CONTRACT,
)
