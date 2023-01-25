# Founders Keepers Project

This project is based off hardhat template: https://hardhat.org/hardhat-runner/docs/getting-started#installation

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

Local Setup:

1. Install remixd globally or within the project: https://www.npmjs.com/package/@remix-project/remixd
2. Run `remixd -s ./shared_project -u https://remix.ethereum.org` to share the project folder to remixd
3. Compile smart contracts: `npx hardhat compile` (This will compile all .sol files under /contracts folder)
4. Run hardhat node locally: `npx hardhat node`
5. Run deployment script: `npx hardhat run scripts/testDeploy.ts --network localhost` (This will deploy the contracts on your local node)
6. Run mint script: `npx hardhat run scripts/mint.ts --network localhost` (This will run the mint script on your local node)
