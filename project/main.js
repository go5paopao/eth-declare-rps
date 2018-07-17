var web3js; //for MetaMask
var abi;
var address;
var contract;
var hostAddress = "";
var guestAddress = "";
var hostLocalHash = "";
var hostEthHash = "";
var guestLocalHash = "";
var guestEthHash = "";
var gamePhase = -1;
var resultPattern = {
  0:"This game is not over yet.",
  1:"Winner: Host player",
  2:"Winner: Guest Player",
  3:"Draw!"
}
var phasePattern = {
  0:"before playing",
  1:"after makeGame by host",
  2:"after joinGame by guest",
  3:"after submit and battle by host (finish)"
}
var playerName = { 0:"HostPlayer", 1:"GuestPlayer"};

// init setting
init();

function init(){
  //set web3js object
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
    var _abi = json["abi"];
    var _address = json["networks"]["3"]["address"]; //ropsten
    //_address = json["networks"]["10"]["address"]; //privateNet
    return {abi:_abi,address:_address};
  })
  .then(function(result){
    contract = web3js.eth.contract(result.abi).at(result.address);
    console.log("contract setting complete");
  })
  .then(function(){
    setEvent();
    checkNetwork();
    showGamePhase();
  })
}

function checkNetwork(){
  web3js.version.getNetwork((err, netId) => {
    switch (netId) {
      case "1":
        console.log('This is mainnet');
        document.getElementById('connectNetwork').innerHTML = "接続先：MainNet";
        break;
      case "2":
        console.log('This is the deprecated Morden test network.');
        document.getElementById('connectNetwork').innerHTML = "接続先：MordenNet";
        break;
      case "3":
        console.log('This is the ropsten test network.');
        document.getElementById('connectNetwork').innerHTML = "接続先：RopstenNet";
        break;
      case "4":
        console.log('This is the Rinkeby test network.');
        document.getElementById('connectNetwork').innerHTML = "接続先：RinkebyNet";
        break
      case "42":
        console.log('This is the Kovan test network.');
        document.getElementById('connectNetwork').innerHTML = "接続先:KovanNet";
        break
      default:
        console.log('This is an unknown network.');
        document.getElementById('connectNetwork').innerHTML = "接続先:unknown";
      ropstenCheck();
    }
    if (netId == 3){
      document.getElementById('checkNetwork').innerHTML = "プレイ可能です";
    }
    else{
      document.getElementById('checkNetwork').innerHTML = "RopstenNetに接続してください";
    } 
  });
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
  var eventHostMakeGame;
  var eventHostSubmit;
  var eventGuestSubmit;
  var eventGameResult;
  var eventMoneyMove;
  var eventMoneyBack;
  var eventResetGame;
  eventHostMakeGame = contract.HostMakeGame();
  eventHostSubmit = contract.HostSubmit();
  eventGuestSubmit = contract.GuestSubmit();
  eventGameResult = contract.GameResult();
  eventMoneyMove = contract.MoneyMove();
  eventMoneyBack = contract.MoneyBack();
  eventResetGame = contract.ResetGame();
  eventHostMakeGame.watch(function (error, result){
    console.log('host makeGame event');
    if (!error){
      console.log(result);
      var txHash = result["transactionHash"];
      showTxStatus(txHash,"makeGameTxStatus");
      showGamePhase();
    }
  });
  eventHostSubmit.watch(function (error, result){
    console.log('host submit event');
    if (!error)
      console.log(result);
      var txHash = result["transactionHash"];
      showTxStatus(txHash,"hostSubmitTxStatus");
      showGamePhase();
  });
  eventGuestSubmit.watch(function (error, result){
    console.log('guest submit event');
    if (!error)
      console.log(result);
      var txHash = result["transactionHash"];
      showTxStatus(txHash,"joinGameTxStatus");
      showGamePhase();
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
  eventResetGame.watch(function (error, result){
    console.log('resetGame event');
    if (!error)
      console.log(result);
      var txHash = result["transactionHash"];
      showTxStatus(txHash,"resetTxStatus");
      showGamePhase();
  });
}

function showTxStatus(txHash,statusId){
  web3js.eth.getTransactionReceipt(txHash,(txReceiptError,txReceipt)=>{
    if(!txReceiptError){
      console.log(txReceipt);
      var txStatus = txReceipt["status"];
      if (txStatus == 0){
        console.log("Transaction failed");
        document.getElementById(statusId).innerHTML = "transaction failed";
      }
      else if (txStatus == 1){
        console.log("Transaction Success!");
        document.getElementById(statusId).innerHTML = "transaction success";
      }
    }
  });
}

function makeGame() {
  if (hostAddress == ""){
    console.error("need to set host address");
    window.alert("HostPlayerのアドレスをセットしてください");
    return;
  }
  var betAmount = document.getElementById("betAmount").value;
  if (betAmount < 0){
    console.error("bet Amount needs more than or equal to 0");
    window.alert("0以上の値を入力して下さい");
    return;
  }
  if (gamePhase != 0){
    console.error("makeGame can be executed when gamePhase is 0.");
    window.alert("ゲームが既に進行しています。続きをするか、RESETをしてください");
    return;
  }
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
      hostLocalHash = res
      document.getElementById("hostLocalHash").innerHTML = hostLocalHash;
      makeGameTransaction(res,betAmount);
    }
    else{
      console.error(err);
    }
  });
}

function makeGameTransaction(hash,betAmount){
  contract.makeGame.sendTransaction(
    hash,
    {from:hostAddress, gas:1000000, value:web3js.toWei(betAmount,"ether")},
    (err,res) =>{
      if(!err){
        console.log("makeGame txId:" + res);
        var etherscanURL = "https://ropsten.etherscan.io/tx/" + res;
        document.getElementById("makeGameTxInfo").innerHTML 
          = `txHash:<a target="_blank" href=${etherscanURL}>${res}</a>`;
      }
      else{
        console.error(err);
      }
  });
}

function joinGame() {
  if (guestAddress == ""){
    console.error("need to set guest address");
    window.alert("GuestPlayerのアドレスをセットしてください");
    return;
  }
  if (guestAddress == hostAddress){
    console.error("same address with host");
    window.alert("HostPlayerとは別のアドレスをセットしてください");
    return;
  }
  var betAmount = document.getElementById("betAmount").value;
  if (betAmount < 0){
    console.error("bet Amount needs more than or equal to 0");
    window.alert("0以上の値を入力して下さい");
    return;
  }
  if (gamePhase == 0){
    console.error("joinGame can be executed when gamePhase is 1.");
    window.alert("ゲームがまだ始まっていません。まずはHostPlayerにてmakeGameをしてください");
    return;
  }
  else if (gamePhase > 1){
    console.error("joinGame can be executed when gamePhase is 1.");
    window.alert("すでにjoinGameをしています。続きを進めるかRESETをしてください。");
    return;
  }
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
      guestLocalHash = res;
      document.getElementById("guestLocalHash").innerHTML = guestLocalHash;
      joinGameTransaction(res,hand,rndStr,betAmount);
    }
    else{
      console.error(err);
    }
  });
}

function joinGameTransaction(guestLocalHash,hand,rndStr,betAmount){
  contract.joinGame.sendTransaction(
    guestLocalHash,
    hand,
    rndStr,
    {from:guestAddress, gas:1000000, value:web3js.toWei(betAmount,"ether")},
    (err,res) =>{
      if(!err){
        console.log("joinGame txId:" + res);
        var etherscanURL = "https://ropsten.etherscan.io/tx/" + res;
        document.getElementById("joinGameTxInfo").innerHTML 
          = `txHash:<a target="_blank" href=${etherscanURL}>${res}</a>`;
      }
      else{
        console.error(err);
      }
  });  
}

function hostSubmit(){
  if (hostAddress == ""){
    console.error("need to set host address");
    window.alert("HostPlayerのアドレスをセットしてください");
    return;
  }
  if (gamePhase < 2){
    console.error("hostSubmit can be executed when gamePhase is 2.");
    window.alert("makeGameまたはjoinGameがまだ行われていません。まずはmakeGameかjoinGameをしてください");
    return;
  }
  else if (gamePhase > 3){
    console.error("hostSubmit can be executed when gamePhase is 2.");
    window.alert("すでにゲームが終了しています。RESETしてやり直してください");
    return;
  }
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
      var etherscanURL = "https://ropsten.etherscan.io/tx/" + res;
      document.getElementById("hostSubmitTxInfo").innerHTML 
        = `txHash:<a target="_blank" href=${etherscanURL}>${res}</a>`;
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
        callback(localHash,guestEthHash);
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
      document.getElementById(targetId).innerHTML = playerName[player] + "Hash not mach.";
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
      if (resultPattern[result]){
        document.getElementById("showGameResult").innerHTML = resultPattern[result];
      }
      else{
        document.getElementById("showGameResult").innerHTML = "NoResult (before battle)";
      }
    }
    else{
      console.error(err);
      return
    }
  });
}

function showGamePhase() {
  contract.getGamePhase((err,res) => {
    if(!err){
      gamePhase = res;
      console.log("getGamePhase:"+res + " " + phasePattern[gamePhase]);
      document.getElementById("gamePhase").innerHTML = phasePattern[gamePhase];
    }
    else{
      console.error(err);
      return
    }
  });
}

// reset contract status for retry game 
function reset(){
  contract.resetGame.sendTransaction({from:hostAddress, gas:1000000},(err,res) =>{
    if(!err){
      console.log("resetGame txId:" + res);
      var etherscanURL = "https://ropsten.etherscan.io/tx/" + res;
      document.getElementById("resetTxInfo").innerHTML 
        = `txHash:<a target="_blank" href=${etherscanURL}>${res}</a>`;
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

