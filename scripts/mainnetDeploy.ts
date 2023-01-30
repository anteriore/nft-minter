import hardhat, { ethers } from "hardhat"
import { saveDeploymentInfo, deploymentInfo } from "../src/deployment"

const NFT_CONTRACT_NAME = "KeepersContract"
const NFT_NAME = "Founders Keepers Genesis Collection"
const NFT_SYMBOL = "KEYS"

async function main() {
  const network = hardhat.network.name

  /** DEPLOY ERC721 */
  console.log(`deploying ${NFT_CONTRACT_NAME} for token ${NFT_NAME} (${NFT_SYMBOL}) to network "${network}"...`)

  const NftContract = await ethers.getContractFactory(NFT_CONTRACT_NAME)
  const nftContract = await NftContract.deploy(NFT_NAME, NFT_SYMBOL, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")

  await nftContract.deployed()

  console.log(`deployed  ${NFT_CONTRACT_NAME} for token ${NFT_NAME} (${NFT_SYMBOL}) to ${nftContract.address} (network: ${network})`)
  /** DEPLOY ERC721 */

  saveDeploymentInfo(deploymentInfo(hardhat, nftContract, NFT_CONTRACT_NAME))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
