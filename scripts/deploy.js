
const fs = require('fs')
const util = require('util')
const { TransactionError } = require('@zilliqa-js/core')
const { BN, Long } = require('@zilliqa-js/util');
const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto');
const { VERSION, zilliqa, network, useKey } = require('./zilliqa')

const readFile = util.promisify(fs.readFile)

async function deploy(privateKey) {
  const [lib, _] = await deployLibrary(privateKey)
  const owner = getAddressFromPrivateKey(privateKey)
  await deployContractUsingLib(privateKey, './contracts/MultiDistributor.scilla', lib.address)
  await deployContractUsingLib(privateKey, './contracts/ZWAPDistributor.scilla', lib.address,
    [
      {
        vname: 'zwap_token_contract',
        type: 'ByStr20',
        value: process.env.ZWAP_TOKEN,
      },
      {
        vname: 'init_owner',
        type: 'ByStr20',
        value: owner,
      },
      {
        vname: 'initial_epoch',
        type: 'Uint32',
        value: '0',
      },
    ]
  )
}

async function deployContractUsingLib(privateKey, file, libraryAddress, additionalInit = []) {
  const code = (await readFile(file)).toString()
  const init = [
    {
      vname: '_scilla_version',
      type: 'Uint32',
      value: '0',
    },
    {
      vname: '_library',
      type: 'Bool',
      value: { constructor: 'True', argtypes: [], arguments: [] },
    },
    {
      vname: '_extlibs',
      type: 'List (Pair (String) (ByStr20))',
      value: [
        // {
        //   constructor : 'Pair',
        //   argtypes : ['String', 'ByStr20'],
        //   arguments : ['DistributorLib', libraryAddress.toLowerCase()]
        // },
      ]
    },
    ...additionalInit
  ];

  console.info(`Deploying contract ${file}...`)
  return deployContract(privateKey, code, init)
}

async function deployLibrary(privateKey) {
  const code = (await readFile('./contracts/DistributorLib.scillib')).toString()
  const init = [
    {
      vname: '_scilla_version',
      type: 'Uint32',
      value: '0',
    },
  ];

  console.info(`Deploying distributor library...`)
  return deployContract(privateKey, code, init)
}

async function deployContract(privateKey, code, init) {
  useKey(privateKey)

  // Check for account
  const address = getAddressFromPrivateKey(privateKey)
  const balance = await zilliqa.blockchain.getBalance(address)
  if (balance.error) {
    throw new Error(balance.error.message)
  }

  const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice()

  // Deploy contract
  const contract = zilliqa.contracts.new(code, init)
  const [deployTx, res] = await contract.deploy(
    {
      version: VERSION,
      amount: new BN(0),
      gasPrice: new BN(minGasPrice.result),
      gasLimit: Long.fromNumber(80000),
    },
    33,
    1000,
    false,
  )

  // Check for txn acceptance
  if (!deployTx.id) {
    throw new Error(JSON.stringify(res.error || 'Failed to get tx id!', null, 2))
  }
  console.info(`Deployment transaction id: ${deployTx.id}`)

  // Check for txn execution success
  if (!deployTx.txParams.receipt.success) {
    const errors = deployTx.txParams.receipt.errors
    const errMsgs = errors
      ? Object.keys(errors).reduce((acc, depth) => {
          const errorMsgList = errors[depth].map(num => TransactionError[num])
          return { ...acc, [depth]: errorMsgList }
        }, {})
      : 'Failed to deploy contract!'
    throw new Error(JSON.stringify(errMsgs, null, 2))
  }

  // Print txn receipt
  console.log(`Deployment transaction receipt:\n${JSON.stringify(deployTx.txParams.receipt)}`)
  await nextBlock()
  await nextBlock()

  // Refetch contract
  console.info(`The contract address is: ${contract.address}`)
  console.log('Refetching contract state...')
  const deployedContract = zilliqa.contracts.at(res.address)
  const state = await deployedContract.getState()

  // Print contract state
  console.log(`The state of the contract is:\n${JSON.stringify(state, null, 2)}`)

  // Return the contract and state
  return [deployedContract, state]
}

async function nextBlock(n = 1) {
  if (network === 'localhost') {
    console.log('Advancing block...')
    const response = await zilliqa.provider.send('IncreaseBlocknum', n)
    if (!response.result) {
      throw new Error(`Failed to advanced block! Error: ${JSON.stringify(response.error)}`)
    }
  }
}

deploy(process.env.PRIVATE_KEY)
