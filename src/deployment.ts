const config = require("getconfig")
const fs = require("fs/promises")

function deploymentInfo(hardhat: any, nftContract: any, contractName: string) {
  return {
    network: hardhat.network.name,
    contract: {
      name: contractName,
      address: nftContract.address,
      signerAddress: nftContract.signer.address,
      abi: nftContract.interface.format(),
    },
  }
}

async function saveDeploymentInfo(info: object, filename = undefined) {
  if (!filename) {
    filename = config.deploymentConfigFile || "nft-deployment.json"
  }

  console.log(`Writing deployment info to ${filename}`)
  const content = JSON.stringify(info, null, 2)
  await fs.writeFile(filename, content, { encoding: "utf-8" })

  return true
}

async function loadDeploymentInfo() {
  let { deploymentConfigFile } = config

  if (!deploymentConfigFile) {
    console.log('no deploymentConfigFile field found in minty config. attempting to read from default path "./minty-deployment.json"')
    deploymentConfigFile = "minty-deployment.json"
  }

  const content = await fs.readFile(deploymentConfigFile, { encoding: "utf8" })
  const deployInfo = JSON.parse(content)

  try {
    validateDeploymentInfo(deployInfo)
  } catch (e: any) {
    throw new Error(`error reading deploy info from ${deploymentConfigFile}: ${e.message}`)
  }

  return deployInfo
}

function validateDeploymentInfo(deployInfo: any) {
  const { contract } = deployInfo

  if (!contract) {
    throw new Error('required field "contract" not found')
  }

  const required = (arg: any) => {
    if (!deployInfo.contract.hasOwnProperty(arg)) {
      throw new Error(`required field "contract.${arg}" not found`)
    }
  }

  required("name")
  required("address")
  required("abi")
}

export { loadDeploymentInfo, saveDeploymentInfo, deploymentInfo }
