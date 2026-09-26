import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==================================================");
  console.log("Starting D-SIVC Smart Contract Deployment...");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  const networkName = network.name;
  const chainId = network.config.chainId || (await ethers.provider.getNetwork()).chainId;

  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Target Network:   ${networkName}`);
  console.log(`Chain ID:         ${chainId.toString()}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account Balance:  ${ethers.formatEther(balance)} POL / ETH`);

  if (balance === BigInt(0) && networkName !== "hardhat" && networkName !== "localhost") {
    console.error("❌ ERROR: Deployer wallet has 0 balance! Please fund the wallet with Amoy test POL.");
    process.exit(1);
  }

  console.log("\nSending deployment transaction to Polygon Amoy...");
  const RegistryFactory = await ethers.getContractFactory("StudentCredentialRegistry");
  const registry = await RegistryFactory.deploy();
  
  console.log("Waiting for transaction confirmation...");
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  const deploymentTx = registry.deploymentTransaction();

  console.log("\n✅ DEPLOYMENT CONFIRMED!");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployment TX:   ${deploymentTx?.hash}`);

  // Post-Deployment Verification Read
  console.log("\nVerifying on-chain contract state via read operations...");
  const ownerAddress = await registry.owner();
  console.log(`On-Chain Contract Owner: ${ownerAddress}`);

  const testRead = await registry.getCredential("TEST_CHECK_NON_EXISTENT");
  console.log(`On-Chain Test Read (Exists): ${testRead.exists}`);

  if (ownerAddress.toLowerCase() === deployer.address.toLowerCase() && !testRead.exists) {
    console.log("✅ ON-CHAIN READ VERIFICATION SUCCESSFUL!");
  } else {
    console.warn("⚠️ Warning: On-chain state read did not return expected default values.");
  }

  // Extract ABI artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/StudentCredentialRegistry.sol/StudentCredentialRegistry.json"
  );

  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifactData = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    abi = artifactData.abi;
  }

  // Write deployment summary JSON file
  const deploymentRecord = {
    network: networkName,
    chainId: chainId.toString(),
    contractAddress,
    deployerAddress: deployer.address,
    transactionHash: deploymentTx?.hash,
    deployedAt: new Date().toISOString(),
    abi,
  };

  const outputDir = path.join(__dirname, "../deployment");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${networkName}-deployment.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentRecord, null, 2));

  console.log(`\nDeployment details saved to: ${outputPath}`);
  console.log("==================================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
