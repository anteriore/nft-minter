// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract KeepersContract is ERC721AQueryable, Ownable {
    bytes32 public merkleRoot;
    uint256 public usdcFee = 940;
    uint256 public maxMintQuantity = 5;
    uint256 public maxTokensOwned = 10;
    uint256 public maxSupply = 200;
    address public usdcTokenAddress;

    using Counters for Counters.Counter;
    Counters.Counter private _lastTokenIdBought;

    constructor(string memory _name, string memory _symbol, address _usdcTokenAddress) ERC721A(_name, _symbol) {
        usdcTokenAddress = _usdcTokenAddress;
    }
    
    function _startTokenId() internal override pure returns (uint256) {
        return 1;
    }

    function _baseURI() internal override pure returns (string memory) {
        return 'https://bafybeihwhpayaous26zuu6nx5pd4c6itcpwbuwul5qvbgnlcq22up5mwge.ipfs.nftstorage.link/';
    }

    function toBytes32(address addr) pure internal returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function mint(address to, uint256 quantity, bytes32[] calldata merkleProof) external {
        IERC20 _token = IERC20(usdcTokenAddress);

        require(MerkleProof.verify(merkleProof, merkleRoot, toBytes32(msg.sender)) == true, "Invalid merkle proof");
        require(totalSupply() + quantity <= maxSupply, "Insufficient tokens to mint");
        require(
            _token.balanceOf(msg.sender) >= usdcFee,
            "Insufficient fees"
        );
        require(quantity > 0 && quantity <= maxMintQuantity, "Invalid quantity");
        console.log("balance");
        console.log(balanceOf(to));
        require(balanceOf(to) + quantity <= maxTokensOwned, "Invalid quantity");

        // Transfer usdc tokens from sender to this contract
        _token.transferFrom(msg.sender, address(this), usdcFee * quantity);

        _mint(to, quantity);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setUsdcFee(uint256 _usdcFee) external onlyOwner {
        usdcFee = _usdcFee;
    }

    function setMaxMintQuantity(uint256 _maxMintQuantity) external onlyOwner {
        maxMintQuantity = _maxMintQuantity;
    }

    function setUsdcTokenAddress(address _usdcTokenAddress) external onlyOwner {
        usdcTokenAddress = _usdcTokenAddress;
    }
}
