const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { getAddressFromPrivateKey } = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

const privateKey = process.env.PRIVATE_KEY;
zilliqa.wallet.addByPrivateKey(privateKey);
const address = getAddressFromPrivateKey(privateKey);
console.log(`Address is: ${address}`);

const contractAddr = '0x3fba5482e459ae8cc61143f5dca3f3b44e59e07b';
const epochNumber = '0';
const amount = '7500000000000000';
const proof = [
  // '0x5899b5583ff1d036c0e7269274a174f5bec5d717fd49c08b8957308279ad2cd1', // leaf
  '0x583fc4d88b1d81dd39ed9eefc2040e6b65fa9e4410e7fe4cbc16d89d50c23f9f',
  '0xf010f28f05594e79bef8c429201f81d442919cd84e08875fe92103eb4b27412e',
  '0x25f61f53d008f0c395d92871805641d62cc64c93e83bfe5f83c74175600e4e14',
  '0x5013c63f366ced7fe7d0b8ca3cbc8d08e792b388ea1e51048d5348cae26af0ce',
  '0xbe5c6bfdc2147cb69b4ddfc9e3ea2f50289228da1cc798cd4aff9f8ba04dadb9',
  '0x0fdda43985409de19506ad1486bc7b7c92b43359232e81de7573b00d430d2c8c',
  // '0x7146bb3e526c1fe181180a02c2f24208ef71324cf052a412971fc2bfdf52fdb1', // root
];

async function claim() {
  try {
    const balance = (await zilliqa.blockchain.getBalance(address)).result.balance;
    console.log(`Balance is: ${balance}`);

    const minGasPrice = (await zilliqa.blockchain.getMinimumGasPrice()).result;
    const contract = zilliqa.contracts.at(contractAddr);
    const callTx = await contract.call(
      'Claim',
      [
        {
          vname: 'claim',
          type: 'Claim',
          value: {
            constructor: 'Claim',
            argtypes: [],
            arguments: [
              epochNumber,
              {
                constructor: 'DistributionLeaf',
                argtypes: [],
                arguments: [address, amount],
              },
              proof,
            ],
          },
        },
      ],
      {
        version: VERSION,
        amount: new BN(0),
        gasPrice: new BN(minGasPrice),
        gasLimit: Long.fromNumber(8000),
      },
      33,
      1000,
      false,
    );

    console.log(JSON.stringify(callTx.receipt, null, 4));
  } catch (err) {
    console.log(err);
  }
}

claim();
