// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NftContract is ERC721URIStorage, Ownable {
    bytes32 public merkleRoot;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public ethFee = 0.1 ether;
    uint256 public usdcFee = 150;
    address public usdcTokenAddress;

    constructor(string memory _name, string memory _symbol, address _usdcTokenAddress) ERC721(_name, _symbol) {
        usdcTokenAddress = _usdcTokenAddress;
    }

    function toBytes32(address addr) pure internal returns (bytes32) {
        return bytes32(uint256(uint160(addr)));
    }

    function mint(address owner, string memory metadataURI) public returns (uint256) {
        _tokenIds.increment();

        uint256 id = _tokenIds.current();

        _safeMint(owner, id);
        _setTokenURI(id, metadataURI);

        return id;
    }

    function mintWithEther(address to,  bytes32[] calldata merkleProof) public payable {
        require(msg.value == ethFee, "Insufficient fees");

        require(MerkleProof.verify(merkleProof, merkleRoot, toBytes32(msg.sender)) == true, "Invalid address");


        _tokenIds.increment();

        uint256 id = _tokenIds.current();

        _safeMint(to, id);
    }

    function mintWithUSDC(address to,  bytes32[] calldata merkleProof) public {
        IERC20 _token = IERC20(usdcTokenAddress);

        require(
            _token.balanceOf(msg.sender) >= usdcFee,
            "Insufficient fees"
        );

        require(MerkleProof.verify(merkleProof, merkleRoot, toBytes32(msg.sender)) == true, "Invalid address");


        _token.transferFrom(msg.sender, address(this), usdcFee);

        _tokenIds.increment();

        uint256 id = _tokenIds.current();

        _safeMint(to, id);
    }

    function nextTokenId() public view returns (uint256) {
        return _tokenIds.current() + 1;
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }
}
