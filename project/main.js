      const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      const coinbase = web3.eth.coinbase;
      var abi;
      var address;
      var contract;
      var eventHostSubmit;
      var eventGuestSubmit;
      var eventGameResult;
      var eventMoneyMove;
      var eventMoneyBack;
      var ownerAddress = web3.eth.accounts[0];
      var hostAddress = web3.eth.accounts[0];
      var guestAddress = web3.eth.accounts[1];
      setAddressTable()
      $.getJSON("/build/contracts/rps.json", function(json){
        var _abi = json["abi"];
        var _address = json["networks"]["10"]["address"];
        setContract(_abi, _address);
      });
      var hostLocalHash = "";
      var hostEthHash = "";
      var guestLocalHash = "";
      var guestEthHash = "";
      var resultPattern = {
        0:"This game is not over yet.",
        1:"Host player Win!!!",
        2:"Guest Player Win!!!",
        3:"Draw!!!"
      }
      function setAddressTable(){
        window.onload = function () {
          document.getElementById("hostPlayerAddress").innerText = hostAddress;
          document.getElementById("guestPlayerAddress").innerHTML = guestAddress;
        };      
     }

      function setContract(_abi, _address){
        abi = _abi;
        address = _address;
        contract = web3.eth.contract(abi).at(address);
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
        hostLocalHash = contract.getHashValue.call(concatStr);
        console.log("hostLocalHash:"+hostLocalHash);
        contract.makeGame.sendTransaction(hostLocalHash,{from:hostAddress, gas:1000000});
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
        guestLocalHash = contract.getHashValue.call(concatStr);
        contract.joinGame.sendTransaction(guestLocalHash,hand,rndStr,{from:guestAddress,gas:1000000});
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
        var res = contract.hostSubmitHand.sendTransaction(hand,rndStr,{from:hostAddress,gas:1000000});
        console.log(res);
      }

      function getHostEthHash() {
        var res = contract.getHostEthHash.call();
        console.log("response:"+res);
        document.getElementById("hostEthHash").innerHTML = res;
        return res
      }

      function getGuestEthHash() {
        var res = contract.getGuestEthHash.call();
        console.log("response:"+res);
        document.getElementById("guestEthHash").innerHTML = res;
        return res;
      }

      function hostGameCheck() {
        hostEthHash = getHostEthHash();
        if (hostEthHash == hostLocalHash){
          console.log("host hash is matched!!");
          document.getElementById("hostCheckResult").innerHTML = "Hash Check Success!!!"
        }
        else{
          console.log("host hash is not corrected.");
          document.getElementById("hostCheckResult").innerHTML = "Hash not mach. Host lose..."
        }
      }

      function guestGameCheck() {
        guestEthHash = getGuestEthHash();
        if (guestEthHash == guestLocalHash){
          console.log("guest hash is matched!!");
          document.getElementById("guestCheckResult").innerHTML = "Hash Check Success!!!"
        }
        else{
          console.log("guest hash is not corrected.");
          document.getElementById("guestCheckResult").innerHTML = "Hash not mach. Guest lose..."
        }
      }

      function showResult() {
        var result = contract.getGameResult.call();
        document.getElementById("showGameResult").innerHTML = resultPattern[result];
      }

      function showGamePhase() {
        var result = contract.getGamePhase.call();
        document.getElementById("showGamePhase").innerHTML = result;
      }

      // reset contract status for retry game 
      function reset(){
        contract.resetGame.sendTransaction({from:ownerAddress,gas:1000000});
      }

      function stringToBytes32(_text) {
        console.log("text:" + _text);
        console.log("text length:"+ _text.length);
        var result = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(_text));
        console.log("result:"+result);
        console.log("result length:"+result.length);
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
        console.log("bytesA:"+bytesA);
        console.log("bytesB:"+bytesB);
        return "0x" + bytesA.substring(2) + bytesB.substring(2);
      }

