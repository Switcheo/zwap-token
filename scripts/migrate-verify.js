const { zilliqa } = require('./zilliqa')

async function verify(legacyAddress, newAddress, maxEpoch) {
  const oldContract = zilliqa.contracts.at(legacyAddress)
  const newContract = zilliqa.contracts.at(newAddress)

  const oldState = await oldContract.getState()
  const newState = await newContract.getState()

  let sum = 0
  for (let i = 0; i <= maxEpoch; ++i) {
    console.log(`checking epoch ${i}`)
    const epoch = i.toString()
    const newMerkleRoot = newState.merkle_roots[epoch]
    const oldMerkleRoot = oldState.merkle_roots[epoch]
    if (newMerkleRoot !== oldMerkleRoot) {
      throw new Error(`new state merkle root at epoch ${i} is ${newMerkleRoot}, expected ${oldMerkleRoot}`)
    }
    const newClaimedLeafs = Object.keys(newState.claimed_leafs[epoch])
    const oldClaimedLeafs = Object.keys(oldState.claimed_leafs[epoch])
    sum += oldClaimedLeafs.length
    if (newClaimedLeafs.length === 0 || JSON.stringify(newClaimedLeafs) !== JSON.stringify(oldClaimedLeafs)) {
      throw new Error(`new state claimed leafs at epoch ${i} is ${newClaimedLeafs}, expected ${oldClaimedLeafs}`)
    }
    console.log(`found ${newClaimedLeafs.length} claimed leafs`)
  }

  console.log(`found ${sum} old total claimed lefas`)

  if (!!newState.merkle_roots[maxEpoch + 1] || !!newState.claimed_leafs[maxEpoch + 1]) {
    throw new Error('new state has too many epochs')
  }

  console.log('Verification complete, state match success.')
}

verify(
  process.env.LEGACY_CONTRACT,
  process.env.NEW_CONTRACT,
  parseInt(process.env.MAX_EPOCH, 10)
)
