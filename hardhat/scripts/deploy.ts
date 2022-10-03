import { ethers } from "hardhat";

// Celo NFT deployed to: 0x83FCab502671D5492E9ac1fB5f8E23aAF0e5c9c9 -> 0xBA4682BCafDf273668e926DefA396A1C649525B8
// NFT Marketplace deployed to: 0xB1aBc2e44647a8BE7D974cc3B04508770B689244

async function main() {
    // Load the NFT contract artifacts
    const CeloNFTFactory = await ethers.getContractFactory("CeloNFT");

    // Deploy the contract
    const celoNftContract = await CeloNFTFactory.deploy();
    await celoNftContract.deployed();

    // Print the address of the NFT contract
    console.log("Celo NFT deployed to:", celoNftContract.address);

    // Load the marketplace contract artifacts
    const NFTMarketplaceFactory = await ethers.getContractFactory("NFTMarketplace");

    // Deploy the contract
    const nftMarketplaceContract = await NFTMarketplaceFactory.deploy();

    // Wait for deployment to finish
    await nftMarketplaceContract.deployed();

    // Log the address of the new contract
    console.log("NFT Marketplace deployed to:", nftMarketplaceContract.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
