import hardhat, { ethers } from "hardhat"

const config = require("getconfig")
const fs = require("fs/promises")

const NFT_CONTRACT_NAME = "NftContract"
const NFT_NAME = "Nft Test"
const NFT_SYMBOL = "NFTT"

const TOKEN_CONTRACT_NAME = "TokenContract"
const TOKEN_NAME = "Token Test"
const TOKEN_SYMBOL = "TT"

async function main() {
  const network = hardhat.network.name

  /** DEPLOY ERC20 */
  console.log(`deploying ${TOKEN_CONTRACT_NAME} for token ${TOKEN_NAME} (${TOKEN_SYMBOL}) to network "${network}"...`)

  const TokenContract = await ethers.getContractFactory(TOKEN_CONTRACT_NAME)
  const tokenContract = await TokenContract.deploy(TOKEN_NAME, TOKEN_SYMBOL)

  await tokenContract.deployed()

  console.log(`deployed  ${TOKEN_CONTRACT_NAME} for token ${TOKEN_NAME} (${TOKEN_SYMBOL}) to ${tokenContract.address} (network: ${network})`)
  /** DEPLOY ERC20 */

  /** DEPLOY ERC721 */
  console.log(`deploying ${NFT_CONTRACT_NAME} for token ${NFT_NAME} (${NFT_SYMBOL}) to network "${network}"...`)

  const NftContract = await ethers.getContractFactory(NFT_CONTRACT_NAME)
  const nftContract = await NftContract.deploy(NFT_NAME, NFT_SYMBOL, tokenContract.address)

  await nftContract.deployed()

  console.log(`deployed  ${NFT_CONTRACT_NAME} for token ${NFT_NAME} (${NFT_SYMBOL}) to ${nftContract.address} (network: ${network})`)
  /** DEPLOY ERC721 */

  saveDeploymentInfo(deploymentInfo(hardhat, nftContract))
}

function deploymentInfo(hardhat: any, nftContract: any) {
  return {
    network: hardhat.network.name,
    contract: {
      name: NFT_CONTRACT_NAME,
      address: nftContract.address,
      signerAddress: nftContract.signer.address,
      abi: nftContract.interface.format(),
    },
  }
}

async function saveDeploymentInfo(info: object, filename = undefined) {
  if (!filename) {
    filename = config.deploymentConfigFile || "nft-deployment.json"
  }

  console.log(`Writing deployment info to ${filename}`)
  const content = JSON.stringify(info, null, 2)
  await fs.writeFile(filename, content, { encoding: "utf-8" })

  return true
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
