import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"

const { alchemyKey, goerliPrivateKey } = require("getconfig")

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${alchemyKey}`,
      accounts: [goerliPrivateKey],
    },
  },
}

export default config
