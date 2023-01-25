import hardhat from "hardhat"

import { loadDeploymentInfo } from "./deployment"
import { getIPFSJSON } from "./ipfs"

//////////////////////////////////////////////
// -------- NFT Retreival
//////////////////////////////////////////////

/**
 * Fetch the NFT metadata for a given token id.
 *
 * @param tokenId - the id of an existing token
 * @returns {Promise<{metadata: object, metadataURI: string}>} - resolves to an object containing the metadata and
 * metadata URI. Fails if the token does not exist, or if fetching the data fails.
 */
async function getNFTMetadata(tokenId: any) {
  const deployInfo = await loadDeploymentInfo()

  // connect to the smart contract using the address and ABI from the deploy info
  const { abi, address } = deployInfo.contract
  const contract: any = await hardhat.ethers.getContractAt(abi, address)

  const metadataURI = await contract.tokenURI(tokenId)
  const metadata = await getIPFSJSON(metadataURI)

  return { metadata, metadataURI }
}

export { getNFTMetadata }
