import hardhat, { ethers } from "hardhat"
import { saveDeploymentInfo, deploymentInfo } from "../src/deployment"

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

  saveDeploymentInfo(deploymentInfo(hardhat, nftContract, NFT_CONTRACT_NAME))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
