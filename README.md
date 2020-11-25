# ZAP Token

$ZAP token is the valueless governance token for [Zilswap](https://zilswap.exchange).

This repository contains the Scilla smart contracts for the ZAP token as well as a merkle distributor for the token. The distributor contract is used to release ZAP tokens at the end of each epoch by setting a merkle root for the distribution data. The merkle root should be determined by indexing on-chain data for the epoch and generating the merkle tree off-chain.
