import { useEffect, useState } from "react";
// ** What's the alternative of getting ERC721 ABI without `wagmi`? Can we do it with OpenZeppelin/ethers?
// ** I think we could def re-create the `ERC721Contract` with ethers.
import { useAccount, useContract, useProvider, erc721ABI } from "wagmi";
import { formatEther } from "ethers/lib/utils";
import { Contract } from "ethers";
import { ERC721ABI } from "../abis/constants";
import { ListingProps, ListingSchema } from "../types";

// ** Fix `any` later
export default function Listing(props: ListingProps) {
  // State variables to hold information about the NFT
  const [imageURI, setImageURI] = useState("");
  const [name, setName] = useState("");

  // Loading state
  const [loading, setLoading] = useState(true);

  // Get the provider, connected address, and a contract instance
  // for the NFT contract using wagmi
  const provider = useProvider();
  const { address } = useAccount();

  // ** Is `ERC721Contract` really the best way to name it? I'd prefer `NFTContract` or smth similar.
  const ERC721Contract = useContract({
    addressOrName: props.nftAddress,
    contractInterface: erc721ABI,
    signerOrProvider: provider,
  });
  // ** Check if the below code would also work
  // const ERC721Contract2 = new Contract(props.nftAddress, ERC721ABI, provider);

  // Check if the NFT seller is the connected user
  const isOwner = address?.toLowerCase() === props.seller.toLowerCase();

  // Fetch NFT details by resolving the token URI
  async function fetchNFTDetails() {
    try {
      // Get token URI from contract
      let tokenURI: string = await ERC721Contract.tokenURI();
      // If it's an IPFS URI, replace it with an HTTP Gateway link
      // tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

      // Resolve the Token URI
      const metadata = await fetch(tokenURI);
      const metadataJSON = await metadata.json();

      // Extract image URI from the metadata
      let image = metadataJSON.imageUrl;
      // If it's an IPFS URI, replace it with an HTTP Gateway link
      // image = image.replace("ipfs://", "https://ipfs.io/ipfs/");
      console.log("image:", image);

      // Update state variables
      setName(metadataJSON.name);
      setImageURI(image);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  // Fetch the NFT details when component is loaded
  useEffect(() => {
    fetchNFTDetails();
  }, []);

  return (
    <div>
      {loading ? (
        <span>Loading...</span>
      ) : (
        <div className="card">
          <img src={imageURI} />
          <div className="container">
            <span>
              <b>
                <>
                  {name} - #{props.tokenId}
                </>
              </b>
            </span>
            <span>Price: {formatEther(props.price)} CELO</span>
            <span>
              Seller: {isOwner ? "You" : props.seller.substring(0, 6) + "..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
