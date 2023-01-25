import hardhat, { ethers } from "hardhat"

async function main() {
  const config = require("getconfig")

  // ipfs.add parameters for more deterministic CIDs
  const ipfsAddOptions = {
    cidVersion: 1,
    hashAlg: "sha2-256",
  }

  console.log(config)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
