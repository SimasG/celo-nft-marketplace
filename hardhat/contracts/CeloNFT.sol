// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CeloNFT is ERC721 {
    constructor() ERC721("CeloNFT", "cNFT") {
        // mint 5 NFTs to yourself
        // Interesting way to mint multiple NFTs
        for (uint256 i = 0; i < 5; i++) {
            _mint(msg.sender, i);
        }
    }

    // Hardcoded token URI will return the same metadata
    // for each NFT
    // ** Why aren't we giving the argument a name (e.g. `uint256` tokenId)?
    function tokenURI(uint256) public pure override returns (string memory) {
        // ** For some reason, this link doesn't work, even if it's ported to a public host ("https://ipfs.io/ipfs/")
        // ** Learn how to better use IPFS later.
        // return "ipfs://QmTy8w65yBXgyfG2ZBg5TrfB2hPjrDQH3RCQFJGkARStJb";
        // ** I guess an img hosted in the cloud is not ideal, even if the original CID remains
        return "https://gateway.pinata.cloud/ipfs/QmQ2NkJW8auAHKBhw18tjNzZV7P8p379zoSDJeHPdTJ9ej";
    }
}
