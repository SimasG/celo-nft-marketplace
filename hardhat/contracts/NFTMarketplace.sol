// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace {
    struct Listing {
        uint256 price;
        address seller;
    }

    mapping(address => mapping(uint256 => Listing)) public listings;

    modifier isNFTOwner(address nftAddress, uint256 tokenId) {
        require(IERC721(nftAddress).ownerOf(tokenId) == msg.sender, "MRKT: Not the owner");
        _;
    }

    // Requires that the specified NFT is not already listed for sale
    modifier isNotListed(address nftAddress, uint256 tokenId) {
        // If listing already existed, listing.price won't be 0 (0 is the default value in solidity)
        require(listings[nftAddress][tokenId].price == 0, "MRKT: Already listed");
        _;
    }

    // Requires that the specified NFT is already listed for sale
    modifier isListed(address nftAddress, uint256 tokenId) {
        require(listings[nftAddress][tokenId].price > 0, "MRKT: Not listed");
        _;
    }

    // * It's important to emit such events because this will help our subgraph later to know
    // * that a new listing has been created, and will allow our frontend to render data accordingly.
    event ListingCreated(address nftAddress, uint256 tokenId, uint256 price, address seller);

    event ListingCanceled(address nftAddress, uint256 tokenId, address seller);

    event ListingUpdated(address nftAddress, uint256 tokenId, uint256 newPrice, address seller);

    event ListingPurchased(address nftAddress, uint256 tokenId, address seller, address buyer);

    function createListing(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external isNotListed(nftAddress, tokenId) isNFTOwner(nftAddress, tokenId) {
        // Cannot create a listing to sell NFT for < 0 ETH
        require(price > 0, "MRKT: Price must be > 0");

        // Check caller is owner of NFT, and has approved
        // the marketplace contract to transfer on their behalf
        // `ownerOf`, `isApprovedForAll` & `getApproved` are all `IERC721.sol` functions
        IERC721 nftContract = IERC721(nftAddress);

        // ** What's the difference between `isApprovedForAll` & `getApproved`?
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)) ||
                nftContract.getApproved(tokenId) == address(this),
            "MRKT: No approval for NFT"
        );

        // Add the listing to our mapping
        listings[nftAddress][tokenId] = Listing({price: price, seller: msg.sender});

        emit ListingCreated(nftAddress, tokenId, price, msg.sender);
    }

    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isListed(nftAddress, tokenId)
        isNFTOwner(nftAddress, tokenId)
    {
        // Delete the Listing struct from the mapping
        // Freeing up storage saves gas!
        delete listings[nftAddress][tokenId];

        // Emit the event
        emit ListingCanceled(nftAddress, tokenId, msg.sender);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isListed(nftAddress, tokenId) isNFTOwner(nftAddress, tokenId) {
        // Cannot update the price to be < 0
        require(newPrice > 0, "MRKT: Price must be > 0");

        // Update the listing price
        listings[nftAddress][tokenId].price = newPrice;

        // Emit the event
        emit ListingUpdated(nftAddress, tokenId, newPrice, msg.sender);
    }

    function purchaseListing(address nftAddress, uint256 tokenId)
        external
        payable
        isListed(nftAddress, tokenId)
    {
        // Load the listing in a local copy
        // ** `memory` makes it cheaper than reading a `storage` variable, correct?
        // ** Plainly using `listings[nftAddress][tokenId]` instead of declaring a `memory` var would
        // ** be more gas expensive since we'd be using a `storage` var everywhere, right?
        Listing memory listing = listings[nftAddress][tokenId];

        // Buyer must have sent enough ETH
        require(msg.value == listings[nftAddress][tokenId].price, "MRKT: Incorrect ETH supplied");

        // Delete listing from storage, save some gas
        delete listings[nftAddress][tokenId];

        // ** Does the order of sending the NFT & receiving ETH matter? If so, is there a way we
        // ** could somehow bundle both transactions where either both succeed or both fail?
        // Transfer NFT from seller to buyer
        IERC721(nftAddress).safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Transfer ETH sent from buyer to seller
        (bool sent, ) = payable(listing.seller).call{value: msg.value}("");
        require(sent, "Failed to transfer eth");

        // Emit the event
        emit ListingPurchased(nftAddress, tokenId, listing.seller, msg.sender);
    }
}
