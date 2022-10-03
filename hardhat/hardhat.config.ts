import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers"; // <- hardhat's waffle replacement
import "dotenv/config";

// Environment variables should now be available
// under `process.env`
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

// Show an error if environment variables are missing
if (!PRIVATE_KEY) {
    console.error("Missing PRIVATE_KEY environment variable");
}

if (!RPC_URL) {
    console.error("Missing RPC_URL environment variable");
}

const config: HardhatUserConfig = {
    solidity: "0.8.4",
    networks: {
        alfajores: {
            url: RPC_URL,
            accounts: [PRIVATE_KEY!],
        },
    },
};

export default config;
