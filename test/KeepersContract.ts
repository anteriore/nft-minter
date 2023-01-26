import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import MerkleTree from "merkletreejs"

const { keccak256 } = ethers.utils

const NFT_CONTRACT_NAME = "KeepersContract"
const NFT_NAME = "Founders Keepers Genesis Collection"
const NFT_SYMBOL = "KEYS"

const TOKEN_CONTRACT_NAME = "TokenContract"
const TOKEN_NAME = "USD//C"
const TOKEN_SYMBOL = "USDC"

// We define a fixture to reuse the same setup in every test.
// We use loadFixture to run this setup once, snapshot that state,
// and reset Hardhat Network to that snapshot in every test.
async function deployContractsFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners()

  const TokenContract = await ethers.getContractFactory(TOKEN_CONTRACT_NAME)
  const tokenContract = await TokenContract.deploy(TOKEN_NAME, TOKEN_SYMBOL)

  const NftContract = await ethers.getContractFactory(NFT_CONTRACT_NAME)
  const nftContract = await NftContract.deploy(NFT_NAME, NFT_SYMBOL, tokenContract.address)

  return { tokenContract, nftContract, owner, otherAccount }
}

describe("Deployment", function () {
  it("Should set the right token name", async function () {
    const { tokenContract } = await loadFixture(deployContractsFixture)

    expect(await tokenContract.name()).to.equal(TOKEN_NAME)
  })

  it("Should set the right token symbol", async function () {
    const { tokenContract } = await loadFixture(deployContractsFixture)

    expect(await tokenContract.symbol()).to.equal(TOKEN_SYMBOL)
  })

  it("Should set the right token owner", async function () {
    const { owner, tokenContract } = await loadFixture(deployContractsFixture)

    expect(await tokenContract.owner()).to.equal(owner.address)
  })

  it("Should set the right nft name", async function () {
    const { nftContract } = await loadFixture(deployContractsFixture)

    expect(await nftContract.name()).to.equal(NFT_NAME)
  })

  it("Should set the right nft symbol", async function () {
    const { nftContract } = await loadFixture(deployContractsFixture)

    expect(await nftContract.symbol()).to.equal(NFT_SYMBOL)
  })

  it("Should set the right usdc address", async function () {
    const { nftContract, tokenContract } = await loadFixture(deployContractsFixture)

    expect(await nftContract.usdcTokenAddress()).to.equal(tokenContract.address)
  })
})

describe("Minting", function () {
  describe("Validations", function () {
    it("Should revert with the right error if address is not whitelisted", async function () {
      const { nftContract, owner, otherAccount } = await loadFixture(deployContractsFixture)

      const whitelisted = ["0xadDcb6D33B6f1b01285f5e98c0837E271A62A895", "0xb66134249278637eeC3086477f1069775fA6037A", otherAccount.address]

      const padBuffer = (addr: any) => {
        return Buffer.from(addr.substr(2).padStart(32 * 2, 0), "hex")
      }
      const leaves = whitelisted.map((address) => padBuffer(address))
      const tree = new MerkleTree(leaves, keccak256, { sort: true })

      const merkleRoot = tree.getHexRoot()
      const merkleProof = tree.getHexProof(padBuffer(owner.address))

      await nftContract.setMerkleRoot(merkleRoot)

      await expect(nftContract.mint(owner.address, 1, merkleProof)).to.be.revertedWith("Invalid merkle proof")
    })

    it("Should revert with the right error if usdc is not enough to mint", async function () {
      const { nftContract, owner } = await loadFixture(deployContractsFixture)

      const whitelisted = ["0xadDcb6D33B6f1b01285f5e98c0837E271A62A895", "0xb66134249278637eeC3086477f1069775fA6037A", owner.address]

      const padBuffer = (addr: any) => {
        return Buffer.from(addr.substr(2).padStart(32 * 2, 0), "hex")
      }
      const leaves = whitelisted.map((address) => padBuffer(address))
      const tree = new MerkleTree(leaves, keccak256, { sort: true })

      const merkleRoot = tree.getHexRoot()
      const merkleProof = tree.getHexProof(padBuffer(owner.address))

      await nftContract.setMerkleRoot(merkleRoot)

      await expect(nftContract.mint(owner.address, 1, merkleProof)).to.be.revertedWith("Insufficient fees")
    })

    it("Should revert with the right error if quantity minted is invalid", async function () {
      const { nftContract, tokenContract, owner } = await loadFixture(deployContractsFixture)

      await tokenContract.mint(owner.address, 940000000000000000000n)

      const whitelisted = ["0xadDcb6D33B6f1b01285f5e98c0837E271A62A895", "0xb66134249278637eeC3086477f1069775fA6037A", owner.address]

      const padBuffer = (addr: any) => {
        return Buffer.from(addr.substr(2).padStart(32 * 2, 0), "hex")
      }
      const leaves = whitelisted.map((address) => padBuffer(address))
      const tree = new MerkleTree(leaves, keccak256, { sort: true })

      const merkleRoot = tree.getHexRoot()
      const merkleProof = tree.getHexProof(padBuffer(owner.address))

      await nftContract.setMerkleRoot(merkleRoot)

      await expect(nftContract.mint(owner.address, 6, merkleProof)).to.be.revertedWith("Invalid quantity")
    })

    it("Should revert with the right error if token contract has not called approve", async function () {
      const { nftContract, tokenContract, owner } = await loadFixture(deployContractsFixture)

      await tokenContract.mint(owner.address, 940000000000000000000n)

      const whitelisted = ["0xadDcb6D33B6f1b01285f5e98c0837E271A62A895", "0xb66134249278637eeC3086477f1069775fA6037A", owner.address]

      const padBuffer = (addr: any) => {
        return Buffer.from(addr.substr(2).padStart(32 * 2, 0), "hex")
      }
      const leaves = whitelisted.map((address) => padBuffer(address))
      const tree = new MerkleTree(leaves, keccak256, { sort: true })

      const merkleRoot = tree.getHexRoot()
      const merkleProof = tree.getHexProof(padBuffer(owner.address))

      await nftContract.setMerkleRoot(merkleRoot)

      await expect(nftContract.mint(owner.address, 1, merkleProof)).to.be.revertedWith("ERC20: insufficient allowance")
    })

    it("Should successfully mint given that all checks have passed", async function () {
      const { nftContract, tokenContract, owner } = await loadFixture(deployContractsFixture)

      await tokenContract.mint(owner.address, 940000000000000000000n) // 940 USDC
      await tokenContract.approve(nftContract.address, 940000000000000000000n) // Approve to spend 940 USDC

      const whitelisted = ["0xadDcb6D33B6f1b01285f5e98c0837E271A62A895", "0xb66134249278637eeC3086477f1069775fA6037A", owner.address]

      const padBuffer = (addr: any) => {
        return Buffer.from(addr.substr(2).padStart(32 * 2, 0), "hex")
      }
      const leaves = whitelisted.map((address) => padBuffer(address))
      const tree = new MerkleTree(leaves, keccak256, { sort: true })

      const merkleRoot = tree.getHexRoot()
      const merkleProof = tree.getHexProof(padBuffer(owner.address))

      await nftContract.setMerkleRoot(merkleRoot)

      await expect(nftContract.mint(owner.address, 1, merkleProof)).not.to.be.reverted
    })
  })
})
