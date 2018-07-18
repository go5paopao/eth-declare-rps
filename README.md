# Ethereum RPS[じゃんけん] (Rock Paper Scissor)

---

## Overview 
- This is Blockchain RPS game in Ethereum.
- for 2 Players(host and guest) 
 - This game is demo, so you play two roles by yourself.
- In ethereum blockchain network, everyone can see the all data in blocks.
To avoid that, I change the game procedure.

## GameProcedure
1. Deploy and set contract (option)
2. I set default contract, but in single contract multiple people cannot play at the same time.
1. HostPlayer: Make game with submitting the hash made from rps hand and random string. 
2. In this phase, host player doesn't submit the rps hand so that other people cannot watch the host hand before submitting hand.
2. At the same time, host player deposits the bet money to the contract.
1. GuestPlayer: Join the game made by host player with submitting the rps hand and random string.
2. At the same time, guest player deposits the bet money to the contract.
1. HostPlayer: Submit the rps hand and random string which are submitted as hash before.
1. RPS battle is executed and the contract sends the bet money to the winner.
2. When the game is a draw, the contract will return the bet money to each player. 

## Reference
- [stackExchange: How secure is this Rock Paper Scissors smart contract?](https://ethereum.stackexchange.com/questions/9394/how-secure-is-this-rock-paper-scissors-smart-contract)

## Condition
- RopstenNet (TestNetwork)

## Requirement
- MetaMask
- Web3js
- truffle
- 2 Accounts who have ether in RopstenNet.

## Author
[go5paopao](https://github.com/go5paopao)


