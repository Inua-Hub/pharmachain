const hre = require("hardhat");

async function main() {
  const PharmaChain = await hre.ethers.getContractFactory("PharmaChain");
  const pharmaChain = await PharmaChain.deploy();
  
  await pharmaChain.waitForDeployment();
  
  const address = await pharmaChain.getAddress();
  console.log("✅ PharmaChain deployed to:", address);
  console.log("📝 Save this address for your frontend!");
  
  // Add a test manufacturer (deployer address)
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  console.log("🔑 This address can create medicines");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
