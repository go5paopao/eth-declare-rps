var web3js; //for MetaMask
var abi;
var address;
var contract;
var eventHostSubmit;
var eventGuestSubmit;
var eventGameResult;
var eventMoneyMove;
var eventMoneyBack;
var hostAddress = "";
var guestAddress = "";
$.getJSON("/build/contracts/rps.json", function(json){
  var _abi = json["abi"];
  var _address = json["networks"]["3"]["address"]; //ropsten
  //var _address = json["networks"]["10"]["address"]; //privateNet
  setContract(_abi, _address);
});
var hostLocalHash = "";
var hostEthHash = "";
var guestLocalHash = "";
var guestEthHash = "";
var resultPattern = {
  0:"This game is not over yet.",
  1:"Winner: Host player",
  2:"Winner: Guest Player",
  3:"Draw!"
}
var playerName = { 0:"HostPlayer", 1:"GuestPlayer"};

connectMetaMask();

function connectMetaMask(){
  if (typeof web3 !== 'undefined') {
    web3js = new Web3(web3.currentProvider);
  } else {
    console.log("cannot access to provider...");
  }
}

function setHostAddress(){
  setAddress(0);
}

function setGuestAddress(){
  setAddress(1);
}

function setAddress(player){ //player => 0:host 1:guest
  web3js.eth.getAccounts(function(err, accounts){
    if(err){
      console.log(err);
      return;
    }
    if (accounts.length == 0){
      console.error("cannot get accounts...please check metamask");
    }
    for(var i=0;i<accounts.length;i++){
      console.log(accounts[i]);
    }
    if (player == 0){
      hostAddress = accounts[0];
      document.getElementById("hostPlayerAddress").innerText = hostAddress;
      console.log("hostAddress:" + hostAddress);
    }
    else if (player == 1){
      guestAddress = accounts[0];
      document.getElementById("guestPlayerAddress").innerHTML = guestAddress;
      console.log("guestAddress:" + guestAddress);
    }
    else {
      console.error("invalid player args");
    }
  });
}


function setContract(_abi, _address){
  abi = _abi;
  address = _address;
  contract = web3js.eth.contract(abi).at(address);
  setEvent();
}

function setEvent() {
  eventHostSubmit = contract.HostSubmit();
  eventGuestSubmit = contract.GuestSubmit();
  eventGameResult = contract.GameResult();
  eventMoneyMove = contract.MoneyMove();
  eventMoneyBack = contract.MoneyBack();
  eventHostSubmit.watch(function (error, result){
    console.log('host submit event');
    if (!error)
      console.log(result);
  });
  eventGuestSubmit.watch(function (error, result){
    console.log('guest submit event');
    if (!error)
      console.log(result);
  });
  eventGameResult.watch(function (error, result){
    console.log('game result event');
    if (!error)
      console.log(result);
  });
  eventMoneyMove.watch(function (error, result){
    console.log('money move event');
    if (!error)
      console.log(result);
  });
  eventMoneyBack.watch(function (error, result){
    console.log('money back event');
    if (!error)
      console.log(result);
  });     
}

function makeGame() {
  var rndStr = document.getElementById("hostRndStr").value;
  var hand;
  var radios = document.getElementsByName("hostHand");
  for(var i=0; i<radios.length;i++){
    if (radios[i].checked) {
      hand = radios[i].value;
      break;
    }
  }
  var handByte = numberToBytes32(hand);
  var rndByte = stringToBytes32(rndStr);
  var concatStr = bytesConcat(handByte,rndByte);
  contract.getHashValue(concatStr,(err,res) => {
    if(!err){
      console.log("GetHashValue:"+res);
      makeGameTransaction(res);
    }
    else{
      console.error(err);
    }
  });
}

function makeGameTransaction(hash){
  console.log("hostLocalHash:"+hash);
  contract.makeGame.sendTransaction(hash,{from:hostAddress, gas:1000000},(err,res) =>{
    if(!err){
      console.log("makeGame txId:" + res);
    }
    else{
      console.error(err);
    }
  });
  document.getElementById("hostLocalHash").innerHTML = hostLocalHash;
}

function joinGame() {
  var rndStr = document.getElementById("guestRndStr").value;
  var hand;
  var radios = document.getElementsByName("guestHand");
  for(var i=0; i<radios.length;i++){
    if (radios[i].checked) {
      hand = radios[i].value;
      break;
    }
  }
  var handByte = numberToBytes32(hand);
  var rndByte = stringToBytes32(rndStr);
  var concatStr = bytesConcat(handByte,rndByte);
  contract.getHashValue(concatStr,(err,res) => {
    if(!err){
      console.log("GetHashValue:"+res);
      joinGameTransaction(res,hand,rndStr);
    }
    else{
      console.error(err);
    }
  });
}

function joinGameTransaction(guestLocalHash,hand,rndStr){
  contract.joinGame.sendTransaction(guestLocalHash,hand,rndStr,{from:guestAddress, gas:1000000},(err,res) =>{
    if(!err){
      console.log("joinGame txId:" + res);
    }
    else{
      console.error(err);
    }
  }); 
  document.getElementById("guestLocalHash").innerHTML = guestLocalHash;

}

function hostSubmit(){
  var rndStr = document.getElementById("hostRndStr").value;
  var hand;
  var radios = document.getElementsByName("hostHand");
  for(var i=0; i<radios.length;i++){
    if (radios[i].checked) {
      hand = radios[i].value;
      break;
    }
  }
  contract.hostSubmitHand.sendTransaction(hand,rndStr,{from:hostAddress, gas:1000000},(err,res) =>{
    if(!err){
      console.log("hostSubmitHand txId:" + res);
    }
    else{
      console.error(err);
    }
  });
}


function getHostEthHash(localHash,callback) {
  contract.getHostEthHash((err,res) => {
      if(!err){
        console.log("getHostEthHash:"+res);
        hostEthHash = res;
        document.getElementById("hostEthHash").innerHTML = res;
        callback(localHash,hostEthHash);
      }
      else{
        console.error(err);
        return
      }
  });
}

function getGuestEthHash(localHash,callback) {
  contract.getGuestEthHash((err,res) => {
      if(!err){
        console.log("getGuestEthHash:"+res);
        guestEthHash = res;
        document.getElementById("guestEthHash").innerHTML = res;
        callback(localHash,hostEthHash);
      }
      else{
        console.error(err);
        return
      }
  });
}


function hostGameCheck() {
  gameCheck(0);
}

function guestGameCheck() {
  gameCheck(1);
}

function gameCheck(player){ //player => 0:host 1:guest
  var ethHash;
  var localHash;
  var targetId;
  if (player == 0){
    ethHashFunc = getHostEthHash;
    localHash = hostLocalHash;
    targetId = "hostCheckResult";
  } else if (player == 1){
    ethHashFunc = getGuestEthHash;
    localHash = guestLocalHash;
    targetId = "guestCheckResult";
  }
  else {
    console.error("invalid args");
    return;
  }
  var callbackFunc = function(localHash,ethHash){
    console.log("localHash:" + localHash);
    console.log("ethHash:"+ ethHash);
    if (ethHash == localHash){
      console.log(playerName[player] + " hash is matched!!");
      document.getElementById(targetId).innerHTML = "Hash Check Success!!!";
    }
    else{
      console.log(playerName[player] + " hash is not matched.");
      document.getElementById(targetId).innerHTML = "Hash not mach. " + playerName[player] + " lose...";
    }
  };
  ethHashFunc(localHash,callbackFunc);
}

function showResult() {
  var result;
  contract.getGameResult((err,res) => {
    if(!err){
      console.log("ShowGameResult:"+res);
      result = res;
      document.getElementById("showGameResult").innerHTML = resultPattern[result];
    }
    else{
      console.error(err);
      return
    }
  });
}

function showGamePhase() {
  var result;
  contract.getGamePhase((err,res) => {
    if(!err){
      console.log("getGamePhase:"+res);
      result = res;
    }
    else{
      console.error(err);
      return
    }
  });
  document.getElementById("showGamePhase").innerHTML = result;
}

// reset contract status for retry game 
function reset(){
  contract.resetGame.sendTransaction({from:hostAddress, gas:1000000},(err,res) =>{
    if(!err){
      console.log("resetGame txId:" + res);
    }
    else{
      console.error(err);
    }
  });
}

function stringToBytes32(_text) {
  var result = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(_text));
  while (result.length < 66) { result += '0'; }
  if (result.length !== 66) { throw new Error("invalid web3 implicit bytes32"); }
  return result;
}

function numberToBytes32(_number) {
  var result = _number;
  while (result.length < 64) { result = '0'+result; }
  if (result.length !== 64) { throw new Error("invalid web3 implicit bytes32"); }
  result = "0x" + result;
  return result;
}

function bytesConcat(bytesA, bytesB){
  return "0x" + bytesA.substring(2) + bytesB.substring(2);
}

