import { BigNumberish } from "ethers";

export type ListingSchema = {
  id: string;
  nftAddress: string;
  tokenId: BigInt;
  price: BigNumberish;
  seller: string;
  buyer: string;
};

export type ListingProps = {
  nftAddress: string;
  tokenId: BigInt;
  price: BigNumberish;
  seller: string;
};
