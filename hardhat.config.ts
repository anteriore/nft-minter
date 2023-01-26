import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"

const { alchemyKey, infuraKey, goerliPrivateKey, mainnetPrivateKey } = require("getconfig")

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${alchemyKey}`,
      accounts: [goerliPrivateKey],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${infuraKey}`,
      accounts: [mainnetPrivateKey],
    },
  },
}

export default config
