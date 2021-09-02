# ZWAP Token

$ZWAP token is the valueless governance token for [Zilswap](https://zilswap.exchange).

This repository contains the Scilla smart contracts for the ZWAP token as well as a merkle distributor for the token. The distributor contract is used to release ZWAP tokens at the end of each epoch by setting a merkle root for the distribution data. The merkle root should be determined by indexing on-chain data for the epoch and generating the merkle tree off-chain.

## Contracts

### TestNet

- ZWAP Token: [`0xb2b119e2496f24590eff419f15aa1b6e82aa7074`](https://viewblock.io/zilliqa/address/0xb2b119e2496f24590eff419f15aa1b6e82aa7074?network=testnet)
- Multi-Distributor: [`0xc7d2678eb68550921862af0a709603dec1efb966`](https://viewblock.io/zilliqa/address/0xc7d2678eb68550921862af0a709603dec1efb966?network=testnet)
- ZWAP Static Distributor: [`0x4e23d05b602ffa931115faf133b56fab57b2293d`](https://viewblock.io/zilliqa/address/0x4e23d05b602ffa931115faf133b56fab57b2293d?network=testnet)
- ZWAP Distributor: [`0x1d9ab755d3101532af7e1aee0fd74dfba350c63c`](https://viewblock.io/zilliqa/address/0x1d9ab755d3101532af7e1aee0fd74dfba350c63c?network=testnet)

### MainNet

- ZWAP Token: [`0x0d21c1901a06abee40d8177f95171c8c63abdc31`](https://viewblock.io/zilliqa/address/0x0d21c1901a06abee40d8177f95171c8c63abdc31?network=mainnet)
- Multi-Distributor: [`0x31608451f965b5efe6319af0e14bc6e4bc6d147f`](https://viewblock.io/zilliqa/address/0x31608451f965b5efe6319af0e14bc6e4bc6d147f?network=mainnet)
- ZWAP Legacy Distributor: ~~[`0xca6d3f56218aaa89cd20406cf22aee26ba8f6089`](https://viewblock.io/zilliqa/address/0xca6d3f56218aaa89cd20406cf22aee26ba8f6089?network=mainnet)~~
- ZWAP Static Distributor: [`0x094920e3b1b8672826a4b2c601999d14eecbeb86`](https://viewblock.io/zilliqa/address/0x094920e3b1b8672826a4b2c601999d14eecbeb86?network=mainnet)
- ZWAP Distributor: [`0x3b01123a67a7a52405ec7cf3083faca65056aec1`](https://viewblock.io/zilliqa/address/0x3b01123a67a7a52405ec7cf3083faca65056aec1?network=mainnet)
