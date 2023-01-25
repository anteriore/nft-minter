import { create } from "ipfs-http-client"
import { getNFTMetadata } from "./nftRetrieval"
import { concat } from "uint8arrays/concat"
import { toString } from "uint8arrays/to-string"

import { extractCID, stripIpfsUriPrefix } from "./uriHelpers"

const all = require("it-all")
const config = require("getconfig")
const CID = require("cids")

//////////////////////////////////////////////
// --------- IPFS helpers
//////////////////////////////////////////////

/**
 * Get the full contents of the IPFS object identified by the given CID or URI.
 *
 * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
 * @returns {Promise<Uint8Array>} - contents of the IPFS object
 */
async function getIPFS(cidOrURI: any) {
  const cid = stripIpfsUriPrefix(cidOrURI)
  const ipfs = create({ url: config.ipfsApiUrl })
  return concat(await all(ipfs.cat(cid)))
}

/**
 * Get the contents of the IPFS object identified by the given CID or URI, and return it as a string.
 *
 * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
 * @returns {Promise<string>} - the contents of the IPFS object as a string
 */
async function getIPFSString(cidOrURI: any) {
  const bytes = await getIPFS(cidOrURI)
  return toString(bytes)
}

/**
 * Get the full contents of the IPFS object identified by the given CID or URI, and return it as a base64 encoded string.
 *
 * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
 * @returns {Promise<string>} - contents of the IPFS object, encoded to base64
 */
async function getIPFSBase64(cidOrURI: any) {
  const bytes = await getIPFS(cidOrURI)
  return toString(bytes, "base64")
}

/**
 * Get the contents of the IPFS object identified by the given CID or URI, and parse it as JSON, returning the parsed object.
 *
 * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
 * @returns {Promise<string>} - contents of the IPFS object, as a javascript object (or array, etc depending on what was stored). Fails if the content isn't valid JSON.
 */
async function getIPFSJSON(cidOrURI: any) {
  const str = await getIPFSString(cidOrURI)
  return JSON.parse(str)
}

//////////////////////////////////////////////
// -------- Pinning to remote services
//////////////////////////////////////////////

/**
 * Pins all IPFS data associated with the given tokend id to the remote pinning service.
 *
 * @param {string} tokenId - the ID of an NFT that was previously minted.
 * @returns {Promise<{assetURI: string, metadataURI: string}>} - the IPFS asset and metadata uris that were pinned.
 * Fails if no token with the given id exists, or if pinning fails.
 */
async function pinTokenData(tokenId: any) {
  const { metadata, metadataURI } = await getNFTMetadata(tokenId)
  const { image: assetURI } = metadata

  console.log(`Pinning asset data (${assetURI}) for token id ${tokenId}....`)
  await pin(assetURI)

  console.log(`Pinning metadata (${metadataURI}) for token id ${tokenId}...`)
  await pin(metadataURI)

  return { assetURI, metadataURI }
}

/**
 * Request that the remote pinning service pin the given CID or ipfs URI.
 *
 * @param {string} cidOrURI - a CID or ipfs:// URI
 * @returns {Promise<void>}
 */
async function pin(cidOrURI: any) {
  const cid = extractCID(cidOrURI)

  // Make sure IPFS is set up to use our preferred pinning service.
  await _configurePinningService()

  // Check if we've already pinned this CID to avoid a "duplicate pin" error.
  const pinned = await isPinned(cid)
  if (pinned) {
    return
  }

  const ipfs = create({ url: config.ipfsApiUrl })

  // Ask the remote service to pin the content.
  // Behind the scenes, this will cause the pinning service to connect to our local IPFS node
  // and fetch the data using Bitswap, IPFS's transfer protocol.
  await ipfs.pin.remote.add(cid, { service: config.pinningService.name })
}

/**
 * Check if a cid is already pinned.
 *
 * @param {string|CID} cid
 * @returns {Promise<boolean>} - true if the pinning service has already pinned the given cid
 */
async function isPinned(cid: any) {
  const ipfs = create({ url: config.ipfsApiUrl })

  if (typeof cid === "string") {
    cid = new CID(cid)
  }

  const opts = {
    service: config.pinningService.name,
    cid: [cid], // ls expects an array of cids
  }
  for await (const _result of ipfs.pin.remote.ls(opts)) {
    return true
  }
  return false
}

/**
 * Configure IPFS to use the remote pinning service from our config.
 *
 * @private
 */
async function _configurePinningService() {
  if (!config.pinningService) {
    throw new Error(`No pinningService set up in minty config. Unable to pin.`)
  }

  const ipfs = create({ url: config.ipfsApiUrl })

  // check if the service has already been added to js-ipfs
  for (const svc of await ipfs.pin.remote.service.ls()) {
    if (svc.service === config.pinningService.name) {
      // service is already configured, no need to do anything
      return
    }
  }

  // add the service to IPFS
  const { name, endpoint, key } = config.pinningService
  if (!name) {
    throw new Error("No name configured for pinning service")
  }
  if (!endpoint) {
    throw new Error(`No endpoint configured for pinning service ${name}`)
  }
  if (!key) {
    throw new Error(
      `No key configured for pinning service ${name}.` +
        `If the config references an environment variable, e.g. '$$PINATA_API_TOKEN', ` +
        `make sure that the variable is defined.`
    )
  }
  await ipfs.pin.remote.service.add(name, { endpoint, key })
}

export { pinTokenData, getIPFSJSON }
