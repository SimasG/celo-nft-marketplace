import { Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createClient } from "urql";
import { useContract, useSigner, erc721ABI } from "wagmi";
import MarketplaceABI from "../../abis/NFTMarketplace.json";
import Navbar from "../../components/Navbar";
import { MARKETPLACE_ADDRESS, SUBGRAPH_URL } from "../../constants";
import styles from "../../styles/Details.module.css";
import { ListingSchema } from "../../types";

const NFTDetails = () => {
  // Extract NFT contract address (CeloNFT) and Token ID from URL
  const router = useRouter();
  // ** Why is the type of `nftAddress` `string | string[] | undefined` & not just `string`?
  // ** Fix `any` later
  const nftAddress: any = router.query.nftContract;
  const tokenId = router.query.tokenId;

  // State variables to contain NFT and listing information
  const [listing, setListing] = useState<ListingSchema>();
  const [name, setName] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // State variable to contain new price if updating listing
  const [newPrice, setNewPrice] = useState("");

  // State variables to contain various loading states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [buying, setBuying] = useState(false);

  // Fetch signer from wagmi
  // ** Fix `any` later
  const { data: signer }: any = useSigner();

  const MarketplaceContract = useContract({
    addressOrName: MARKETPLACE_ADDRESS,
    contractInterface: MarketplaceABI,
    signerOrProvider: signer,
  });

  async function fetchListing() {
    const listingQuery = `
        query ListingQuery {
            listingEntities(where: {
                nftAddress: "${nftAddress}",
                tokenId: "${tokenId}"
            }) {
                id
                nftAddress
                tokenId
                price
                seller
                buyer
            }
        }
    `;

    const urqlClient = createClient({ url: SUBGRAPH_URL });

    // Send the query to the subgraph GraphQL API, and get the response
    // @ts-ignore
    const response = await urqlClient.query(listingQuery).toPromise();
    const listingEntities: ListingSchema[] = response.data.listingEntities;

    // If no active listing is found with the given parameters,
    // inform user of the error, then redirect to homepage
    if (listingEntities.length === 0) {
      window.alert("Listing does not exist or has been canceled");
      return router.push("/");
    }

    // Grab the first listing - which should be the only one matching the parameters
    const listing = listingEntities[0];

    // Get the signer address
    const address = await signer?.getAddress();

    // Update state variables
    // ** Does this mean that if the NFT has been purchased, `isActive` is false?
    setIsActive(listing.buyer === null);
    setIsOwner(address?.toLowerCase() === listing.seller.toLowerCase());
    setListing(listing);
  }

  // Function to fetch NFT details from its metadata, similar to the one in Listing.js
  async function fetchNFTDetails() {
    const ERC721Contract = new Contract(nftAddress, erc721ABI, signer);
    let tokenURI = await ERC721Contract.tokenURI(tokenId);
    // tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");

    const metadata = await fetch(tokenURI);
    const metadataJSON = await metadata.json();

    let image: string = metadataJSON.imageUrl;
    // image = image.replace("ipfs://", "https://ipfs.io/ipfs/");

    setName(metadataJSON.name);
    setImageURI(image);
  }

  // Function to call `updateListing` in the smart contract
  async function updateListing() {
    setUpdating(true);
    const updateTxn = await MarketplaceContract.updateListing(
      nftAddress,
      tokenId,
      parseEther(newPrice)
    );
    await updateTxn.wait();
    await fetchListing();
    setUpdating(false);
  }

  // Function to call `cancelListing` in the smart contract
  async function cancelListing() {
    setCanceling(true);
    const cancelTxn = await MarketplaceContract.cancelListing(
      nftAddress,
      tokenId
    );
    await cancelTxn.wait();
    window.alert("Listing canceled");
    await router.push("/");
    setCanceling(false);
  }

  // Function to call `buyListing` in the smart contract
  async function buyListing() {
    setBuying(true);
    const buyTxn = await MarketplaceContract.purchaseListing(
      nftAddress,
      tokenId,
      {
        value: listing?.price,
      }
    );
    await buyTxn.wait();
    await fetchListing();
    setBuying(false);
  }

  // Load listing and NFT data on page load
  useEffect(() => {
    // ** Why do we need `signer` to display the listing?
    if (router.query.nftContract && router.query.tokenId && signer) {
      Promise.all([fetchListing(), fetchNFTDetails()]).finally(() =>
        setLoading(false)
      );
    }
  }, [router, signer]);

  return (
    <>
      <Navbar />
      <div>
        {loading ? (
          <span>Loading...</span>
        ) : (
          <div className="containerDetails">
            <div className="details">
              <img src={imageURI} />
              <span>
                <b>
                  {name} - #{tokenId}
                </b>
              </span>

              <span>
                <>Price: {listing?.price} CELO</>
              </span>
              <span>
                <a
                  href={`https://alfajores.celoscan.io/address/${listing?.seller}`}
                  target="_blank"
                >
                  Seller:{" "}
                  {isOwner ? "You" : listing?.seller.substring(0, 6) + "..."}
                </a>
              </span>
              <span>Status: {listing?.buyer === null ? "Active" : "Sold"}</span>
            </div>

            <div className="options">
              {!isActive && (
                <span>
                  Listing has been sold to{" "}
                  <a
                    href={`https://alfajores.celoscan.io/address/${listing?.buyer}`}
                    target="_blank"
                  >
                    {listing?.buyer}
                  </a>
                </span>
              )}

              {isOwner && isActive && (
                <>
                  <div className="updateListing">
                    <input
                      type="text"
                      placeholder="New Price (in CELO)"
                      value={newPrice}
                      onChange={(e) => {
                        if (e.target.value === "") {
                          setNewPrice("0");
                        } else {
                          setNewPrice(e.target.value);
                        }
                      }}
                    ></input>
                    <button disabled={updating} onClick={updateListing}>
                      Update Listing
                    </button>
                  </div>

                  <button
                    className="btn"
                    disabled={canceling}
                    onClick={cancelListing}
                  >
                    Cancel Listing
                  </button>
                </>
              )}

              {!isOwner && isActive && (
                <button className="btn" disabled={buying} onClick={buyListing}>
                  Buy Listing
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NFTDetails;
