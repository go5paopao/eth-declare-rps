function deploy(){
  //set web3js object
  let web3js;
  let hostAccount;
  let gasEstimate;
  let abi;
  let address;
  let bytecode;
  let deployBytecode;
  if (typeof web3 !== 'undefined') {
    web3js = new Web3(web3.currentProvider);
  } else {
    console.log("cannot access to provider...");
  }
  $.ajax({
    type: "GET",
    url: "/build/contracts/rps.json",
    dataType: "json"
  })
  .then(function(json){
    abi = json["abi"];
    address = json["networks"]["3"]["address"]; //ropsten
    bytecode = json["bytecode"];
    deployBytecode = json["deployBytecode"];
    //_address = json["networks"]["10"]["address"]; //privateNet
  })
  .then(function(){
    contract = web3js.eth.contract(abi).at(address);
    console.log("contract setting complete");
    //get acount
    web3js.eth.getAccounts(function(err, accounts){
      hostAccount = accounts[0]; 
    });
  }).then(function(){
    web3js.eth.estimateGas({data: bytecode},(err,res)=>{
      if(!err){
        console.log(res);
        gasEstimate = res;
        console.log("estimatedGas:"+gasEstimate);
        let deployedContract = web3js.eth.contract(abi).new({from:hostAccount,data:bytecode,gas:gasEstimate},function(err,res){
          console.log(err);
          console.log(res);
        });
      }
    });
  })
}
