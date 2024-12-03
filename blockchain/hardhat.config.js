require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks:{
    crossfi:{
      url:`https://crossfi-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      chainId:4157,
      accounts:[process.env.PRIVATE_KEY]
    }
  }
};
