var rps = artifacts.require("rps");

module.exports = function(deployer) {
  // Use deployer to state migration tasks.
  deployer.deploy(rps); 
};
