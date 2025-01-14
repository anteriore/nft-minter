// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract KeepersContract is ERC721AQueryable, Ownable {
    using SafeMath for uint256;

    uint256 public usdcFee;
    uint256 public maxMintQuantity;
    uint256 public maxSupply;
    address public usdcTokenAddress;
    address public paymentRecepient;
    string private baseUri;
    bool private isPublic = false;
    address[] private whitelist;

    constructor(string memory _name, string memory _symbol, address _usdcTokenAddress) ERC721A(_name, _symbol) {
        usdcTokenAddress = _usdcTokenAddress;
        usdcFee = 920000000 wei; // 920 USDC
        maxMintQuantity = 5;
        maxSupply = 200;
        paymentRecepient = address(0xaB1d84559E9D9eBcf6De4FA93E0c897b755E1331);
        baseUri = 'https://bafybeibaultu6wpwrq7jj2w2qh7hbi2evj2cyff4ao3co4z5eq6o5vk35e.ipfs.nftstorage.link/';
    }
    
    function _startTokenId() internal override pure returns (uint256) {
        return 1;
    }

    function _baseURI() internal override view returns (string memory) {
        return baseUri;
    }

    function mint(address to, uint256 quantity) external {
        IERC20 _token = IERC20(usdcTokenAddress);

        require(isPublic || isAddressWhitelisted(msg.sender) == true, "Invalid address");
        require(totalSupply() + quantity <= maxSupply, "Insufficient tokens to mint");
        require(
            _token.balanceOf(msg.sender) >= usdcFee,
            "Insufficient fees"
        );
        require(quantity > 0 && quantity <= maxMintQuantity, "Invalid quantity");

        _token.transferFrom(msg.sender, paymentRecepient, usdcFee * quantity);

        _mint(to, quantity);
    }

    function premint(address to, uint256 quantity) external onlyOwner {
        require(totalSupply() + quantity <= maxSupply, "Insufficient tokens to mint");

        _mint(to, quantity);
    }

    function isAddressWhitelisted(address _addr) public view returns (bool) {
        for (uint256 i = 0; i < whitelist.length; i++) {
            if (whitelist[i] == _addr) {
                return true;
            }
        }

        return false;
    }

    function setUsdcFee(uint256 _usdcFee) external onlyOwner {
        usdcFee = _usdcFee;
    }

    function setMaxMintQuantity(uint256 _maxMintQuantity) external onlyOwner {
        maxMintQuantity = _maxMintQuantity;
    }

    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(_maxSupply >= totalSupply(), "Invalid max supply");

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

    function setIsPublic(bool _isPublic) external onlyOwner {
        isPublic = _isPublic;
    }

    function setWhitelist(address[] calldata _whitelist) external onlyOwner {
        whitelist = _whitelist;
    }
}
