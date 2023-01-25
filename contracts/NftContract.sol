// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NftContract is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public ethFee = 0.1 ether;
    uint256 public usdcFee = 150;
    address public usdcTokenAddress;

    constructor(string memory _name, string memory _symbol, address _usdcTokenAddress) ERC721(_name, _symbol) {
        usdcTokenAddress = _usdcTokenAddress;
    }

    function mint(address owner, string memory metadataURI) public returns (uint256) {
        _tokenIds.increment();

        uint256 id = _tokenIds.current();

        _safeMint(owner, id);
        _setTokenURI(id, metadataURI);

        return id;
    }

    function mintWithEther(address to) public payable {
        require(msg.value == ethFee, "Insufficient fees");

        _tokenIds.increment();

        uint256 id = _tokenIds.current();

        _safeMint(to, id);
    }

    function mintWithUSDC(address to) public {
        IERC20 _token = IERC20(usdcTokenAddress);

        require(
            _token.balanceOf(msg.sender) >= usdcFee,
            "Insufficient fees"
        );

        _token.transferFrom(msg.sender, address(this), usdcFee);

        _tokenIds.increment();

        uint256 id = _tokenIds.current();

        _safeMint(to, id);
    }
}
