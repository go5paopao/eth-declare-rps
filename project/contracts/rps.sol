pragma solidity ^0.4.22;

contract rps{
    address hostPlayer;
    address guestPlayer;
    bool matching = false; //after matching, true
    uint8 result = 0; //0:not yet 1:win host 2:win guest 3:draw 
    bytes32 hostSelectHash;
    bytes32 guestSelectHash;
    uint8 hostHand;
    uint8 guestHand;
    uint betAmount;

    constructor (bytes32 hashValue) public payable {
        hostPlayer = msg.sender;
        betAmount = msg.value;
    }

    function joinGame() public payable{
        require(msg.sender != hostPlayer); // cannot play with same player
        require(msg.value == betAmount); // need same bet amount with host
        require(address(this).balance == betAmount*2);
        guestPlayer = msg.sender;
        matching = true;
    }
 
    function setHostHash(bytes32 hashValue) public {
        require(msg.sender == hostPlayer);
        require(matching);
        hostSelectHash = hashValue;
    }

    function setGuestHash(bytes32 hashValue) public {
        require(msg.sender == guestPlayer);
        require(matching);
        guestSelectHash = hashValue;
    }

    function submitHostHand(uint8 hand, string rndStr) public {
        require(msg.sender == hostPlayer);
        bytes memory concatStr = _concat(bytes32(hand),_stringToBytes32(rndStr));
        bytes32 submitHash = sha256(concatStr);
        if (submitHash != hostSelectHash){
            result = 1;
        }
        hostHand = hand;
    }

    function submitGuestHand(uint8 hand, string rndStr) public {
        require(msg.sender == guestPlayer);
        bytes memory concatStr = _concat(bytes32(hand),_stringToBytes32(rndStr));
        bytes32 submitHash = sha256(concatStr);
        if (submitHash != guestSelectHash){
            result = 2;
        }
        guestHand = hand;
    }

    function rpsBattle() private {
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
