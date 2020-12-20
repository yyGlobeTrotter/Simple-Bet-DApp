# ConsenSys Blockchain Developer Bootcamp Final Project -- Yue's Simple Bet DApp v0.1
***

![Simple Bet DApp Temp Logo](/client/src/SimpleBet_Logo.png "Simple Bet DApp Temp Logo")

## DApp Walkthrough DEMO

A screen recording demo walking-through of this DApp can be found here:
[Yue's Simple Bet DApp v0.1] (https://youtu.be/eze9cSu1xwQ)

## Project Description

### Introduction

This project is an Ethereum Web 3.0 decentralized application (DApp).

It allows any user with a MetaMask wallet to participate in decentralized betting directly from a MetaMask enabled browser.

It also allows bet market owners to create and manage bet markets either via Ethereum direct contract call or via a MetaMask enabled browser (*Note: v0.1 only allows one bet market owner who is the owner of the `SimpleBet.sol` smart contract. Decentralized market creation and management by users will be implemented in future releases*).

- Users can deposit to (or withdraw from) their own wallets in the DApp at any time with or without any active bets
- Users can bet on any open market created by the owners (*Note: in v0.1 only one price prediction market on USD/ETH is available - customized multiple markets will be implemented in future releases*)
- Users can check and view their bet market, bet summary and user status (including wallet balance and bet status) at any time
- Owners will take a low fee for the bet markets they created and successfully participated by the users (*Note: in v0.1 this feature is not implemented yet. It'll be added to future releases*)

### User Stories

Users can view open bet markets, active bets, make deposit, request withdrawal, place a bet of their choice, and refresh status.

Owners can create new bet, manually close an existing bet, manually resolve a live bet, pause betting/pause contract functionalities, and resume betting/resume contract functionalities.

#### User Dashboard

User dashboard is a centralized page users will see when they access this DApp from a Web3 MetaMask enabled browser. It displays everything related to:

- Betting rules
- Bet market and User account alert/reminder
- Open bet market details
- User status
- Bet summary
- Additional actions

- **Betting rules | View:** A cardboard displaying current rules | **Actions:** None
- **Bet market/User account alert | View:** Flash banners showing relevant market/account alert/reminder | **Actions:** User can scroll down to the bottom of the User Dashboard page for relevant actions to be taken
- **Open bet market details | View:** Market description, current price, current time, etc. | **Actions:** None
- **User status | View:** Details of Wallet Balance, Bet Amount, Has Betted, Bet Choice, Winner | **Actions:** Deposit, Withdraw (Withdraw action is disabled if zero balance in user wallet)
- **Bet summary | View:** Details of the open bets: Underlying, Strike Price, Status, Start Time, Close Time, Total Pot Size, Total Confirmed Bets, Total Bets Above, Total Bets Below, Final Price, and Bet Outcome | **Actions:** Bet Above, Bet Below (both actions are disabled if bet is not live or betting window closed or user has already betted or zero balance in user wallet)
- **Additional actions | View:** List of additional actions that users can take at their relevant user stage and overall betting stage | **Actions:** Refresh (disabled after bet is resolved), Bet Again or Open Bets (enabled after bet is resolved)

#### Owner Dashboard - Start Page

![Owner Dashboard Start Page](/client/src/OwnerDashboard_StartPage.png "Owner Dashboard Start Page")

Owner Dashboard Start Page is the first page owners see when they access this DApp after new deployment of the `SimpleBet.sol` smart contract on relevant blockchain network. It should display bet market creation and management rules and allows owners to create their own bet markets and create new bet in their market choice (*Note: in v0.1 the list of bet markets is pre-populated, owner just need to enter a strike price to create a new bet. Full features are WIP at the moment, will be included in future releases*).

- **Existing bet market selection | View:** A list of market description and radio button for owner selection | **Actions:** Make a selection
- **New bet creation | View:** An input box to enter strike price and a "Create New Bet" button | **Actions:** Enter strike price and create new bet

#### Owner Dashboard

![Owner Dashboard - Page Top View](/client/src/OwnerDashboard_PageTopView.png "Owner Dashboard - Page Top View")
![Owner Dashboard - Page Bottom View](/client/src/OwnerDashboard_PageBottomView.png "Owner Dashboard - Page Bottom View")

Owner dashboard is a centralized page owners will see when they access this DApp from a Web3 MetaMask enabled browser. It displays everything related to:

- Open bet market details
- Bet summary
- Additional actions

- **Open bet market details | View:** Market description, current price, current time, etc. | **Actions:** None
- **Bet summary | View:** Details of the open bets from owners' perspective: Status, Start Time, Close Time, Strike Price, Final Price, Total Confirmed Bets, Total Bets Above, Total Bets Below, Total Pot, Bet Outcome, and Total Winners | **Actions:** Close Bet (Close Bet action is disabled after bet is closed), Resolve Bet (Revolve Bet action is disabled after bet is resolved) (*Note: in v0.1 owners need to close and resolve bets manually. Automatic bet cutoff & result resolve will be implemented in future releases*)
- **Additional actions | View:** List of additional actions that owners can take depending on the overall betting stage | **Actions:** Pause Betting (permanently enabled for circuit breaker purposes), Create New Bet (*Note: this is temporarily disabled in v0.1. It will be enabled in future releases*), Reset Bet (enabled after bet is resolved)(*Note: in future releases this will be handled automatically*)

## Project Architecture and Technical Requirements

### Solidity Contracts

#### SimpleBet.sol

This contract is a child of OpenZepplin's `Ownable.sol` contract.

- Contract does not have addresses with DEFAULT_ADMIN role
- OWNER role is the admin role
- uses library `SafeMath` to protest against Integer Overflow and Underflow attacks

### Folder Structure

- `root directory`: A standard truffle project structure with `truffle-config.js` to set up smart contract development and deployment environment, and `package.json` to install all necessary dependencies for local contract development.
- `client/` folder: A standard React based client-side implementation of the project. It was built with `truffle unbox react`.

## How to Run this DApp -- Rinkeby deployment is WIP!!

### Technical Requirements to Run the Project Locally

- Truffle v5.1.56 (core: 5.1.56)
- Solidity - 0.6.0 (solc-js)
- Node v12.19.0
- Web3.js v1.2.9

### To Compile and Test Solidity Contract Locally (*Truffle test is currently WIP!!*)

1. Navigate to the root directory
2. Run `yarn install` for OpenZepplin dependencies
3. Run `truffle compile`
4. Run `truffle test`

### To Run this DApp from a Web3-enabled Browser and connect with a Blockchain Testnet

*MetaMask is required to connect this project to a Web3-enabled browser*
*An INFURA Project ID is required to connect this project to the Ethereum networks such as Rinkeby Testnet*

Frontend is connected to the contract deployed to **Rinkeby** Testnet, address `0x9CB8fE775d3f1Be5Ca6B2a024f0b6aC57704b5F1`

1. Create a `.env` file and save it in the project root directory
2. The format of the `env` file should look like this:
  INFURA_PROJECT_ID=<*Your own project id*>
  MNEMONIC="<*Your own 12-words MetaMask mnemonic*>"
3. Navigate to `/client` folder
4. Run `yarn install` or `npm install` to install all client-side dependencies such as a local lite-server.
5. Run `yarn start` or `npm run start` to start the server, it will automatically open up a browser page.
6. Follow the directions on User Dashboard to run through different actions and see results

## Tools/Libraries Used to Build/Test this Project

This past two and half months has been an incredible journey!

I learned how to write Solidity smart contract code and use all tools mentioned below completely from scratch (except for Atom and MetaMask) :)

- **Solidity** is used to write the smart contract sitting in the backend
- **Truffle React** is used to write Web3 frontend to enable user interaction with the DApp via a familiar web experience
- **Web3.js** is used to develop the frontend
- **MetaMask** Chrome browser extension is required for users to be able to interact with this DApp. It is used to engage the Ethereum blockchain networks.
- **INFURA** This project uses INFURA to connect with the Ethereum **Rinkeby** Testnet
- **Ganache-cli** is used as my local development server
- **Remix IDE** and **Truffle Debug** are used for debugging and testing of the smart contract
- **Visual Studio Code** and **Atom** are used as text editors
- **OpenZeppelin** is used to support good design pattern (Restricting Access) and for avoiding potential Integer Overflow and Underflow attacks.
- **Rimble** is used for Web3 frontend UI style and layout design
- **Chainlink** or **Rhombus Lighthouse** is to be used as offchain Oracle market data provider (*Note: still WIP - exploring best solutions*)

## Unit Tests (*Solidity and JavaScript tests are currently WIP!!*)

I have tested the entire lifecycle of the front-/back-end execution and conditional rending of `SimpleBet.sol` contract v0.1, via simultaneously developed React frontend interaction (a Web3 user interface designed for both contract owner and users).
