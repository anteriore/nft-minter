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
    uint256 public usdcFee = 940 ether;
    uint256 public maxMintQuantity = 5;
    uint256 public maxSupply = 200;
    address public usdcTokenAddress;
    address private paymentRecepient;
    string private baseUri;

    constructor(string memory _name, string memory _symbol, address _usdcTokenAddress) ERC721A(_name, _symbol) {
        usdcTokenAddress = _usdcTokenAddress;
        paymentRecepient = msg.sender;
        baseUri = 'https://bafybeibaultu6wpwrq7jj2w2qh7hbi2evj2cyff4ao3co4z5eq6o5vk35e.ipfs.nftstorage.link/';
    }
    
    function _startTokenId() internal override pure returns (uint256) {
        return 1;
    }

    function _baseURI() internal override view returns (string memory) {
        return baseUri;
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

        _token.transferFrom(msg.sender, paymentRecepient, usdcFee * quantity);

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

    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        maxSupply = _maxSupply;
    }

    function setPaymentRecepient(address _paymentRecepient) external onlyOwner {
        paymentRecepient = _paymentRecepient;
    }

    function setUsdcTokenAddress(address _usdcTokenAddress) external onlyOwner {
        usdcTokenAddress = _usdcTokenAddress;
    }

    function setBaseUri(string memory newBaseUri) external onlyOwner {
        baseUri = newBaseUri;
    }
}
