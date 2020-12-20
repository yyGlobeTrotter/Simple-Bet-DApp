# Design Pattern Decisions
***

## SimpleBet.sol and App.js

### 1. Fail Early and Fail Loud

This contract supports the Fail Early and Fail Loud design pattern by implementing a number of modifiers and `require()` calls to check conditions required for execution as early as possible in the function body and throws an exception if the condition is not met. This is meant to be a good practice to reduce unnecessary code execution in the event that an exception will be thrown.

### 2. Restricting Access

This contract supports the Restricting Access design pattern by restricting certain function access to owner only so that only specific address (owner) is permitted to execute these functions.

This contract is built on top of the OpenZeppelin Access Control contract `Ownable.sol` which allows to set the role (Owner) and assign admin rights to it.

- The use of Function `isOwner()` and Modifier `onlyOwner()` to ensure safe access to functions that only owner is allowed to call
- The use of `isOwner` state variable in the Web3 front end to restrict admin view only to owner of the contract

### 3. Mortal

This contract supports the Mortal design pattern by implementing a `kill()` function which is able to destroy the contract and remove it from the blockchain. This function can be called by owner only.

### 4. Pull over Push Payments (Withdrawal Pattern)

This contract supports Pull over Push Payments design pattern, which protects against re-entrancy and denial of service attacks.

First, this contract implements a separation of function logic. The private `setBetPayout()` function handles the accounting. It calculates and allocates winning payout from total pot to each individual account. Another public function, `userWithdraw()`, allows accounts to transfer their balance from the contract to their account.

### 5. Circuit Breaker

This contract supports Circuit Breaker design pattern, which allows contract functionality to be stopped. This would be desirable in situations where there is a live contract where a bug has been detected. Freezing the contract would be beneficial for reducing harm before a fix can be deployed.

Methods are implemented in both `SimpleBet.sol` and `App.js` to offer double security, which allows owner of the smart contract to pause and resume contract functionality as necessary (either from front or the back-end), and simultaneously disables user access to all DApp functionalities when the contract is paused. Implementation details are as follows:

#### Within `SimpleBet.sol` Smart Contract

Methods to pause/resume contract functionality by owner only:

- Modifier `notPaused()`
- Modifier `Paused()`
- Function `pauseBet()`
- Function `resumeBet()`

#### Within `App.js` Front End

Methods to disable user access to all DApp functionalities as well as to allow owner to pause/resume contract functionality:

- Use state variable `isPaused` to toggle what can be rendered on Web3 front-End. Users cannot view or perform any action when contract is paused
- Method `handlePauseBet(event)` for owner to trigger circuit breaker and pause contract functionality
- Method `handleResumeBet(event)` for owner to stop circuit breaker and resume normal functionality
- UI display of a <Flash/> alert banner on top of screen when contract is paused

### 6. State Machine

This contract supports State Machine design pattern, when the contract has certain states in which it behaves differently and different functions can and should be called. Some Implementations in this DApp include the following:

- Owner can only close bet in the bet "STARTED" stage
- Users can only take bet in the bet "STARTED" stage
- Front-end views and available actions for both owner and users differ at different bet stages
