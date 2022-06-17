// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SampleNFT is ERC721URIStorage {
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("SampleNFT", "ITM") {}

    /**
     * @dev Safely mints a new token with the `tokenURI` and transfers it to `to`.
     */
    function mint721( string memory tokenURI) public returns (uint256){
        address to = msg.sender;
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _safeMint(to, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function transferToFather(address from, address to, uint256 tokenId, bytes memory _data) public{
        safeTransferFrom(from, to, tokenId, _data);
    }
}