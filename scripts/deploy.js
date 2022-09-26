// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {

  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy({ value: hre.ethers.utils.parseEther("1") });

  await vault.deployed();

  console.log(
    `Vault Contract deployed to ${vault.address}`
  );
  
  const victimAddress=vault.address;
  
  const Exploit = await hre.ethers.getContractFactory("Exploit");
  const exploit = await Exploit.deploy(victimAddress, { value: hre.ethers.utils.parseEther("3") });

  await exploit.deployed();

  console.log(
    `Vault Contract Exploited by : ${exploit.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().then(
  console.log(ethers.con)
).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
