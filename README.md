# ZWAP Token

$ZWAP token is the valueless governance token for [Zilswap](https://zilswap.exchange).

This repository contains the Scilla smart contracts for the ZWAP token as well as a merkle distributor for the token. The distributor contract is used to release ZWAP tokens at the end of each epoch by setting a merkle root for the distribution data. The merkle root should be determined by indexing on-chain data for the epoch and generating the merkle tree off-chain.

## Contracts

### TestNet

- ZWAP Token: [`0xb2b119e2496f24590eff419f15aa1b6e82aa7074`](https://viewblock.io/zilliqa/address/0xb2b119e2496f24590eff419f15aa1b6e82aa7074?network=testnet)
- Multi-Distributor: [`0xdffc96d9042b954a2ec49c3b503c0fa67c4e3948`](https://viewblock.io/zilliqa/address/0xdffc96d9042b954a2ec49c3b503c0fa67c4e3948?network=testnet)
- ZWAP Distributor: [`0x55fc7c40cc9d190aad1499c00102de0828c06d41`](https://viewblock.io/zilliqa/address/0x55fc7c40cc9d190aad1499c00102de0828c06d41?network=testnet)

### MainNet

- ZWAP Token: [`0xba11eb7bcc0a02e947acf03cc651bfaf19c9ec00`](https://viewblock.io/zilliqa/address/0xba11eb7bcc0a02e947acf03cc651bfaf19c9ec00?network=mainnet)

- V1 ZWAP Distributor:
