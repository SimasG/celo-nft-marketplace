import type { NextPage } from "next";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Listing from "../components/Listing";
import { createClient } from "urql";
import Link from "next/link";
import { SUBGRAPH_URL } from "../constants";
import { useAccount } from "wagmi";
import { ListingSchema } from "../types/index";

const Home: NextPage = () => {
  // State variables to contain active listings and signify a loading state
  const [listings, setListings] = useState<ListingSchema[]>();
  const [loading, setLoading] = useState(false);

  const { isConnected } = useAccount();

  // Function to fetch listings from the subgraph
  async function fetchListings() {
    setLoading(true);
    // The GraphQL query to run -> trying to fetch *all* the listings there is
    const listingsQuery = `
      query ListingsQuery {
        listingEntities {
          id
          nftAddress
          tokenId
          price
          seller
          buyer
        }
      }
    `;

    // Create a urql Client -> this central Client manages all of our GraphQL requests and results
    const urqlClient = createClient({
      url: SUBGRAPH_URL,
    });

    // Send the query to the subgraph GraphQL API, and get the response
    // ** Would like to avoid using ts-ignore that much
    // @ts-ignore
    const response = await urqlClient.query(listingsQuery).toPromise();
    const listingEntities = response.data.listingEntities;

    // Filter out active listings i.e. ones which haven't been sold yet
    const activeListings = listingEntities.filter(
      (l: ListingSchema) => l.buyer === null
    );

    // Update state variables
    setListings(activeListings);
    setLoading(false);
  }

  useEffect(() => {
    // Fetch listings on page load once wallet connection exists
    if (isConnected) {
      fetchListings();
    }
  }, []);

  return (
    <>
      {/* Add Navbar to homepage */}
      <Navbar />

      {/* Show loading status if query hasn't responded yet */}
      {loading && isConnected && <span>Loading...</span>}

      {/* Render the listings */}
      <div className="containerHome">
        {!loading &&
          listings &&
          listings.map((listing) => {
            return (
              <Link
                key={listing.id}
                href={`/${listing.nftAddress}/${listing.tokenId}`}
              >
                <a>
                  <Listing
                    nftAddress={listing.nftAddress}
                    tokenId={listing.tokenId}
                    price={listing.price}
                    seller={listing.seller}
                  />
                </a>
              </Link>
            );
          })}
      </div>

      {/* Show "No listings found" if query returned empty */}
      {!loading && listings && listings.length === 0 && (
        <span>No listings found</span>
      )}
    </>
  );
};

export default Home;
