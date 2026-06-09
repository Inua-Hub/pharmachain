require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/",
      accounts: []
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
