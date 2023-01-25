import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"

const projConfig = require("getconfig")

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${projConfig.alchemyKey}`,
      accounts: [projConfig.goerliPrivateKey],
    },
  },
}

export default config
