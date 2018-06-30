pragma solidity ^0.4.22;

contract rps{
    address owner;
    address hostPlayer;
    address guestPlayer;
    bool matching = false; //after matching, true
    uint8 result = 0; //0:not yet 1:win host 2:win guest 3:draw 
    bytes32 hostSelectHash;
    bytes32 guestSelectHash;
    bytes32 hostSubmitHash;
    bytes32 guestSubmitHash;
    uint8 hostHand;
    uint8 guestHand;
    uint betAmount;

    event HostSubmit(uint8 hand, string rndStr, bytes32 hash);
    event GuestSubmit(uint8 hand, string rndStr, bytes32 hash);

    constructor () public{
        owner = msg.sender;
    }

    // call when host player game makes
    // set hostplayer address, betAmount, and hashValue for hand check
    function makeGame(bytes32 hashValue) public payable {
        hostPlayer = msg.sender;
        betAmount = msg.value;
        _setHostHash(hashValue);
    }

    // call when guest player join the game maked by host player
    // 1. set guestplayer address and guest hashvalue for hand check
    // 2. check the hash value by hand and rndStr
    function joinGame(bytes32 hashValue, uint8 hand, string rndStr) public payable{
        require(msg.sender != hostPlayer); // cannot play with same player
        require(msg.value == betAmount); // need same bet amount with host
        guestPlayer = msg.sender;
        matching = true;
        _setGuestHash(hashValue);
        if( _checkGuestHand(hand, rndStr)){
            guestHand = hand;
        }
        else {
            result = 1; //Guest lose
        }
    }

    // call when host player confirm and submit hand
    // 1. check the hash value by hand and rndStr
    // 2. rps battle (host hand and guest hand)
    // 3. money move (loser to winner)
    function hostSubmitAndResult(uint8 hand, string rndStr) public{
        require(msg.sender == hostPlayer);
        if (_checkHostHand(hand, rndStr)){
            hostHand = hand;
        }
        else{
            result = 2; //Host lose
        }
        if (result == 0){
            _rpsBattle;
        }
        _moneyMove();
    }

    function getHostSubmitHash() public view returns(bytes32){
        return hostSubmitHash;
    }

    function getGuestSubmitHash() public view returns(bytes32){
        return guestSubmitHash;
    }
 
    function _setHostHash(bytes32 hashValue) private {
        require(!matching);
        hostSelectHash = hashValue;
    }

    function _setGuestHash(bytes32 hashValue) private{
        require(msg.sender == guestPlayer);
        require(matching);
        guestSelectHash = hashValue;
    }

    function _checkHostHand(uint8 hand, string rndStr) private returns(bool){
        bytes memory concatStr = _concat(bytes32(hand),_stringToBytes32(rndStr));
        hostSubmitHash = sha256(concatStr);
        HostSubmit(hand, rndStr, hostSubmitHash);
        if (hostSubmitHash != hostSelectHash){
            return false;
        }
        return true;
    }

    function _checkGuestHand(uint8 hand, string rndStr) private returns(bool){
        bytes memory concatStr = _concat(bytes32(hand),_stringToBytes32(rndStr));
        guestSubmitHash = sha256(concatStr);
        GuestSubmit(hand, rndStr, guestSubmitHash);
        if (guestSubmitHash != guestSelectHash){
            return false;
        }
        return true;
    }

    function _rpsBattle() private {
        int diff = hostHand - guestHand;
        // draw
        if (diff == 0){
            result = 3;
         }
        // win
        else if (diff == -1 || diff == 2){
            result = 1;
        }
        // lose
        else{
            result = 2;
        }
    }

    function _moneyMove() private {
        require(result > 0);
        if (result == 1){ //host win
            hostPlayer.transfer(betAmount*2);
        }
        else if (result == 2){ //guest win
            guestPlayer.transfer(betAmount*2);
        }
        else if (result == 3){ //draw
            hostPlayer.transfer(betAmount);
            guestPlayer.transfer(betAmount);
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
}
