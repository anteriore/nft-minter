import hardhat from "hardhat"
import { create } from "ipfs-http-client"
import { loadDeploymentInfo } from "../src/deployment"
import { pinTokenData } from "../src/ipfs"
import { stripIpfsUriPrefix, makeGatewayURL, ensureIpfsUriPrefix } from "../src/uri-helpers"

const config = require("getconfig")
const fs = require("fs/promises")
const path = require("path")

// ipfs.add parameters for more deterministic CIDs
const ipfsAddOptions: any = {
  cidVersion: 1,
  hashAlg: "sha2-256",
}

async function main() {
  const nft = await createNFTFromAssetFile("C:\\Users\\vince\\Pictures\\1.png", {})
  console.log(nft)

  const ipfsData = await pinTokenData(nft.tokenId)
  console.log(ipfsData)
}

//////////////////////////////////////////////
// ------ NFT Creation
//////////////////////////////////////////////

/**
 * Create a new NFT from the given asset data.
 *
 * @param {Buffer|Uint8Array} content - a Buffer or UInt8Array of data (e.g. for an image)
 * @param {object} options
 * @param {?string} path - optional file path to set when storing the data on IPFS
 * @param {?string} name - optional name to set in NFT metadata
 * @param {?string} description - optional description to store in NFT metadata
 * @param {?string} owner - optional ethereum address that should own the new NFT.
 * If missing, the default signing address will be used.
 *
 * @typedef {object} CreateNFTResult
 * @property {string} tokenId - the unique ID of the new token
 * @property {string} ownerAddress - the ethereum address of the new token's owner
 * @property {object} metadata - the JSON metadata stored in IPFS and referenced by the token's metadata URI
 * @property {string} metadataURI - an ipfs:// URI for the NFT metadata
 * @property {string} metadataGatewayURL - an HTTP gateway URL for the NFT metadata
 * @property {string} assetURI - an ipfs:// URI for the NFT asset
 * @property {string} assetGatewayURL - an HTTP gateway URL for the NFT asset
 *
 * @returns {Promise<CreateNFTResult>}
 */
async function createNFTFromAssetData(content: any, options: any) {
  const ipfs = create({ url: config.ipfsApiUrl })

  // add the asset to IPFS
  const filePath = options.path || "asset.bin"
  const basename = path.basename(filePath)

  // When you add an object to IPFS with a directory prefix in its path,
  // IPFS will create a directory structure for you. This is nice, because
  // it gives us URIs with descriptive filenames in them e.g.
  // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM/cat-pic.png' instead of
  // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM'
  const ipfsPath = "/nft/" + basename
  const { cid: assetCid } = await ipfs.add({ path: ipfsPath, content }, ipfsAddOptions)

  // make the NFT metadata JSON
  const assetURI = ensureIpfsUriPrefix(assetCid) + "/" + basename
  const metadata = await makeNFTMetadata(assetURI, options)

  // add the metadata to IPFS
  const { cid: metadataCid } = await ipfs.add({ path: "/nft/metadata.json", content: JSON.stringify(metadata) }, ipfsAddOptions)
  const metadataURI = ensureIpfsUriPrefix(metadataCid) + "/metadata.json"

  // get the address of the token owner from options, or use the default signing address if no owner is given
  let ownerAddress = options.owner
  if (!ownerAddress) {
    ownerAddress = await defaultOwnerAddress()
  }

  // mint a new token referencing the metadata URI
  const tokenId = await mintToken(ownerAddress, metadataURI)

  // format and return the results
  return {
    tokenId,
    ownerAddress,
    metadata,
    assetURI,
    metadataURI,
    assetGatewayURL: makeGatewayURL(assetURI),
    metadataGatewayURL: makeGatewayURL(metadataURI),
  }
}

/**
 * @returns {Promise<string>} - the default signing address that should own new tokens, if no owner was specified.
 */
async function defaultOwnerAddress() {
  const signers = await hardhat.ethers.getSigners()
  return signers[0].address
}

/**
 * Helper to construct metadata JSON for
 * @param {string} assetCid - IPFS URI for the NFT asset
 * @param {object} options
 * @param {?string} name - optional name to set in NFT metadata
 * @param {?string} description - optional description to store in NFT metadata
 * @returns {object} - NFT metadata object
 */
async function makeNFTMetadata(assetURI: any, options: any) {
  const { name, description } = options
  assetURI = ensureIpfsUriPrefix(assetURI)

  return {
    name,
    description,
    image: assetURI,
  }
}

/**
 * Create a new NFT from an asset file at the given path.
 *
 * @param {string} filename - the path to an image file or other asset to use
 * @param {object} options
 * @param {?string} name - optional name to set in NFT metadata
 * @param {?string} description - optional description to store in NFT metadata
 * @param {?string} owner - optional ethereum address that should own the new NFT.
 * If missing, the default signing address will be used.
 *
 * @returns {Promise<CreateNFTResult>}
 */
async function createNFTFromAssetFile(filename: string, options: any) {
  const content = await fs.readFile(filename)
  return createNFTFromAssetData(content, { ...options, path: filename })
}

//////////////////////////////////////////////
// --------- Smart contract interactions
//////////////////////////////////////////////

/**
 * Create a new NFT token that references the given metadata CID, owned by the given address.
 *
 * @param {string} ownerAddress - the ethereum address that should own the new token
 * @param {string} metadataURI - IPFS URI for the NFT metadata that should be associated with this token
 * @returns {Promise<string>} - the ID of the new token
 */
async function mintToken(ownerAddress: any, metadataURI: any) {
  const deployInfo = await loadDeploymentInfo()

  // connect to the smart contract using the address and ABI from the deploy info
  const { abi, address } = deployInfo.contract
  const contract: any = await hardhat.ethers.getContractAt(abi, address)

  // Call the mintToken method to issue a new token to the given address
  // This returns a transaction object, but the transaction hasn't been confirmed
  // yet, so it doesn't have our token id.
  const tx = await contract.mint(ownerAddress, metadataURI)

  // The OpenZeppelin base ERC721 contract emits a Transfer event when a token is issued.
  // tx.wait() will wait until a block containing our transaction has been mined and confirmed.
  // The transaction receipt contains events emitted while processing the transaction.
  const receipt = await tx.wait()

  for (const event of receipt.events) {
    if (event.event !== "Transfer") {
      console.log("ignoring unknown event type ", event.event)
      continue
    }
    return event.args.tokenId.toString()
  }

  throw new Error("unable to get token id")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})