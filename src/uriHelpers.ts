const config = require("getconfig")
const CID = require("cids")

/**
 * Return an HTTP gateway URL for the given IPFS object.
 * @param {string} ipfsURI - an ipfs:// uri or CID string
 * @returns - an HTTP url to view the IPFS object on the configured gateway.
 */
function makeGatewayURL(ipfsURI: any) {
  return config.ipfsGatewayUrl + "/" + stripIpfsUriPrefix(ipfsURI)
}

/**
 * @param {string} cidOrURI either a CID string, or a URI string of the form `ipfs://${cid}`
 * @returns the input string with the `ipfs://` prefix stripped off
 */
function stripIpfsUriPrefix(cidOrURI: any) {
  if (cidOrURI.startsWith("ipfs://")) {
    return cidOrURI.slice("ipfs://".length)
  }
  return cidOrURI
}

/**
 *
 * @param {string} cidOrURI - an ipfs:// URI or CID string
 * @returns {CID} a CID for the root of the IPFS path
 */
function extractCID(cidOrURI: any) {
  // remove the ipfs:// prefix, split on '/' and return first path component (root CID)
  const cidString = stripIpfsUriPrefix(cidOrURI).split("/")[0]
  return new CID(cidString)
}

function ensureIpfsUriPrefix(cidOrURI: any) {
  let uri = cidOrURI.toString()
  if (!uri.startsWith("ipfs://")) {
    uri = "ipfs://" + cidOrURI
  }
  // Avoid the Nyan Cat bug (https://github.com/ipfs/go-ipfs/pull/7930)
  if (uri.startsWith("ipfs://ipfs/")) {
    uri = uri.replace("ipfs://ipfs/", "ipfs://")
  }
  return uri
}

export { makeGatewayURL, stripIpfsUriPrefix, extractCID, ensureIpfsUriPrefix }
