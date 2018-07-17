pragma solidity ^0.4.22;

contract rps{
    address owner;
    address hostPlayer;
    address guestPlayer;
    uint8 result = 0; //0:not yet 1:win host 2:win guest 3:draw 
    // gamePhase
    //0:before game start
    //1:after making game(host) 
    //2:after guest joined game and submit hand(guest)
    //3:after host submited hand and game is finished.
    uint8 gamePhase = 0; 
    bytes32 hostClientHash;
    bytes32 guestClientHash;
    bytes32 hostEthHash;
    bytes32 guestEthHash;
    uint8 hostHand;
    uint8 guestHand;
    uint betAmount;

    event HostMakeGame(address hostAddress, bytes32 submitLocalHash);
    event HostSubmit(uint8 hand, string rndStr, bytes32 ethHash);
    event GuestSubmit(uint8 hand, string rndStr, bytes32 ethHash);
    event GameResult(uint result, uint8 hostHand, uint8 guestHand);
    event MoneyMove(address from, address to, uint sendAmount);
    event MoneyBack(address to, uint backAmount);
    event ResetGame(address operater);

    constructor () public{
        owner = msg.sender;
    }

    // call when host player game makes
    // set hostplayer address, betAmount, and hashValue for hand check
    function makeGame(bytes32 hashValue) public payable {
        require(gamePhase == 0,"required before game making (gamePhase==0)");
        hostPlayer = msg.sender;
        betAmount = msg.value;
        _setHostClientHash(hashValue);
        gamePhase = 1;
        emit HostMakeGame(hostPlayer, hashValue);
    }

    // call when guest player join the game maked by host player
    // 1. set guestplayer address and guest hashvalue for hand check
    // 2. check the hash value by hand and rndStr
    function joinGame(bytes32 hashValue, uint8 hand, string rndStr) public payable{
        require(gamePhase == 1,"required after making game (gamePhase==1)");
        require(msg.sender != hostPlayer,"cannot play with same player");
        require(msg.value == betAmount,"require the same amount of betAmount with host");
        guestPlayer = msg.sender;
        _setGuestClientHash(hashValue);
        if( _checkGuestHand(hand, rndStr)){
            guestHand = hand;
        }
        else {
            result = 1; //Guest lose
        }
        gamePhase = 2;
    }

    // call when host player confirm and submit hand
    // 1. check the hash value by hand and rndStr
    // 2. rps battle (host hand and guest hand)
    // 3. money move (loser to winner)
    function hostSubmitHand(uint8 hand, string rndStr) public{
        require(gamePhase == 2,"required after guest joined");
        require(msg.sender == hostPlayer,"only hostPlayer");
        if (_checkHostHand(hand, rndStr)){
            hostHand = hand;
        }
        else{
            result = 2; //Host lose
        }
        if (result == 0){ // if game result is not decided, rps battle start.
            _rpsBattle();
        }
        emit GameResult(result,hostHand,guestHand);
        _moneyMove(); //Money move to winner from loser.
        gamePhase = 3;
    }

    // return the game result
    function getGameResult() public view returns(uint8){
        require(gamePhase == 3,"required after host submited hand.");
        return result;
    }

    // return the game phase
    function getGamePhase() public view returns(uint8){
        return gamePhase;
    }

    function resetGame() public{
        //require(msg.sender == owner); //when real, need this reauire
        gamePhase = 0;
        result = 0;
        hostPlayer = 0x0;
        guestPlayer = 0x0;
        hostHand = 0;
        guestHand = 0;
        betAmount = 0;
        hostClientHash = "0x";
        guestClientHash = "0x";
        hostEthHash = "0x";
        guestEthHash = "0x";
        emit ResetGame(msg.sender);
    }


    function getHostEthHash() public view returns(bytes32){
        return hostEthHash;
    }

    function getGuestEthHash() public view returns(bytes32){
        return guestEthHash;
    }

    function getHostClientHash() public view returns(bytes32){
        return hostClientHash;
    }
    function getGuestClientHash() public view returns(bytes32){
        return guestClientHash;
    }
 
    function _setHostClientHash(bytes32 hashValue) private {
        hostClientHash = hashValue;
    }

    function _setGuestClientHash(bytes32 hashValue) private{
        guestClientHash = hashValue;
    }

    function _checkHostHand(uint8 hand, string rndStr) private returns(bool){
        bytes memory concatStr = _concat(bytes32(hand),_stringToBytes32(rndStr));
        hostEthHash = getHashValue(concatStr);
        emit HostSubmit(hand, rndStr, hostEthHash);
        if (hostEthHash != hostClientHash){
            return false;
        }
        return true;
    }

    function _checkGuestHand(uint8 hand, string rndStr) private returns(bool){
        bytes memory concatStr = _concat(bytes32(hand),_stringToBytes32(rndStr));
        guestEthHash = getHashValue(concatStr);
        emit GuestSubmit(hand, rndStr, guestEthHash);
        if (guestEthHash != guestClientHash){
            return false;
        }
        return true;
    }

    function _rpsBattle() private {
        // draw
        if (hostHand == guestHand){
            result = 3;
         }
        // win
        else if ((hostHand==1&&guestHand==2)
            || (hostHand==2&&guestHand==3)
            || (hostHand==3&&guestHand==1)){
            result = 1;
        }
        // lose
        else{
            result = 2;
        }
    }

    function _moneyMove() private {
        require(result > 0,"require rps battle is finished");
        if (result == 1){ //host win
            hostPlayer.transfer(betAmount*2);
            emit MoneyMove(guestPlayer, hostPlayer, betAmount*2);
        }
        else if (result == 2){ //guest win
            guestPlayer.transfer(betAmount*2);
            emit MoneyMove(hostPlayer, guestPlayer, betAmount*2);
        }
        else if (result == 3){ //draw
            hostPlayer.transfer(betAmount);
            emit MoneyBack(hostPlayer, betAmount);
            guestPlayer.transfer(betAmount);
            emit MoneyBack(guestPlayer, betAmount);
        }    
    }

    function _concat(bytes32 a, bytes32 b) private pure returns(bytes){
        bytes memory ab = new bytes(a.length + b.length);
        uint k = 0;
        for (uint i = 0; i < a.length; i++) ab[k++] = a[i];
        for (     i = 0; i < b.length; i++) ab[k++] = b[i];
        return ab;
    }

    function _stringToBytes32(string memory source) private pure returns (bytes32) {
        bytes memory tempEmptyStringTest = bytes(source);
        bytes32 afterData;
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            afterData := mload(add(source, 32))
        }
        return afterData;
    }

    function getHashValue(bytes byteA) public pure returns (bytes32){
       return keccak256(byteA);
    }
}
