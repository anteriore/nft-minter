// 1. Imports
import { ethers } from "hardhat"
import MerkleTree from "merkletreejs"

const { keccak256 } = ethers.utils

// 2. Whitelisted addresses
const whitelisted = [
  "0x79Ea2d536b5b7144A3EabdC6A7E43130199291c0",
  "0x18c37f21D3C29f9a53A96CA678026DC660180065",
  "0x4B7E3FD09d45B97EF1c29085FCAe143444E422e8",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0xadDcb6D33B6f1b01285f5e98c0837E271A62A895",
]

// 3. Creating a buffer since we bytes array
const padBuffer = (addr: any) => {
  return Buffer.from(addr.substr(2).padStart(32 * 2, 0), "hex")
}

// 4. Creating buffer from leaves (lowest points in tree)
const leaves = whitelisted.map((address) => padBuffer(address))
const tree = new MerkleTree(leaves, keccak256, { sort: true })

// 5. Creating a merkleRoot that we'll inject into smart contract
const merkleRoot = tree.getHexRoot()

// 6. Calculating merkleProof to check if an address is whitelisted
const merkleProof = tree.getHexProof(padBuffer("0xadDcb6D33B6f1b01285f5e98c0837E271A62A895"))

console.log(merkleRoot)
console.log(merkleProof)
