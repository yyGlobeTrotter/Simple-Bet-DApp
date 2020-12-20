SPDX-License-Identifier: MIT

pragma solidity >=0.5.0 <0.7.0;

//import "../contracts/Ilighthouse.sol";
import '../../node_modules/@openzeppelin/contracts/math/SafeMath.sol';
import '../../node_modules/@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title SimpleBet Smart Contract
 * @author Yue WANG
 * @notice This app is in very early alpha and not production ready
**/
contract SimpleBet is Ownable {
    /// Libraries
    using SafeMath for uint;
    using SafeMath for uint256;

    /// Oracle Lighthouse
    /// ILighthouse public myLighthouse;
    
    /**
     *  Events - publicize actions to external listeners
    **/
    event LogPauseBet();
    event LogResumeBet();

    event LogCreateBet(address indexed sender, uint256 strikePrice);
    event LogCloseBet(address indexed sender);
    event LogResolveBet(address indexed sender, uint256 strikePrice, uint256 finalPrice, BetChoice outcome);
    /// TODO -- to add bet ID & winner address list
    event LogSetBetPayout(address indexed sender, uint256 totalPot, uint256 winnerCount);
    event LogResetBet(address indexed sender);

    event LogUserDeposit(address indexed sender, uint256 amount);
    event LogUserWithdraw(address indexed sender, uint256 walletAmount);
    event LogUserTakeBet(address indexed sender, BetChoice choice);

    /// Storage Variables
    address[5] public userAccounts;         // Array of users registered
    uint256 public numAccounts = 0;         // Should be <= 4, this holds number of registered users

    bool public isPaused;
    uint256 currPrice;
    uint256 finalPrice;

    enum BetChoice { NA, Above, Below }
    enum BetStatus { NOT_STARTED, STARTED, CLOSED, RESOLVED }

    /// This represents a single user
    struct User {
      uint256 balance;          // Stores ether user deposited in a wallet
      uint256 betAmount;        // Holds ether user have set aside for betting on an upcoming stock price bet 
      bool hasBetted;           // If true, the user has already betted
      BetChoice chosenBet;      // Holds users bet choice on an upcoming stock price bet
      bool hasWon;              // Holds users betting outcome - True (bet successful) or False (bet failed)
    }

    /// This represents a single bet
    ///   TODO -- Underlying should have their own structs or classes, to be implemented...
    ///   TODO -- Bet ID to be added after Bet Factory implementation
    struct Bet {
      //uint256 betId;
      //string underlying;          
      uint256 strikePrice;
      uint256 createTime;
      uint256 endTime;
      BetChoice outcome;
      uint256 totalPot;
      uint256 betterCount;
      uint256 upCount;
      uint256 downCount;
      uint256 winnerCount;
      BetStatus status;
      bool isLive;
    }

    function isOwner(address msgSender) public view returns (bool) {
        return (owner() == msgSender);
    }

    /// Declares a state variable that stores a `User` struct for each possible address
    mapping(address => User) public users;

    /// Instantiate and set default value to Bet
    Bet bet = Bet(0, 0, 0, BetChoice.NA, 0, 0, 0, 0, 0, BetStatus.NOT_STARTED, false);

    /// Modifiers
    ///   TODO -- More to be Added!
    modifier notPaused() {
      require(!isPaused, 'Error: circuit breaker activated');
      _;
    }

    modifier paused() {
      require(isPaused, 'Error: circuit breaker NOT activated');
      _;
    }

    modifier betIsLive() {
      require(bet.isLive, 'Error: bet NOT live');
      _;
    }

    /**
     *  Constructor
     * constructor(ILighthouse _myLighthouse) public { 
     *   myLighthouse = _myLighthouse; 
     * }
    **/

    /**
     *  Contruct Destructor - Mortal design pattern to destroy the contract n remove from blockchain
     * }
    **/
    function kill() public onlyOwner {
      selfdestruct(address(uint160(owner()))); /// cast owner to address payable
    }

    /**
     *   Receive Ether function 
    **/
    event Received(address, uint256);
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    /**
     *   Fallback function - Called if other functions don't match call or sent ether without data
    **/
    fallback() external payable {
      revert();
    }

    /**
     *  Functions to display the internal state (Pass in sender address manually 
     *     coz truffle proxy contracts interfer with msg.sender)
    **/
    /// Removed view keyword for getCurrPrice and getFinalPrice because of Oracle call
    function getCurrPrice() public returns(uint256) {
      currPrice = getCurrPriceFromOracle();
      return currPrice;
    }

    function getFinalPrice() public returns(uint256) {
      finalPrice = getFinalPriceFromOracle();
      return finalPrice;
    }

    function getUserAccounts() public view returns(address[5] memory) {
      return userAccounts;
    }

    function getThisAccount(uint ind) public view returns(address) {
      require(ind < 5, "No more than 5 accounts are allowed at a time");
      return userAccounts[ind];
    }

    function getNumAccounts() public view returns(uint256) {
      return numAccounts;
    }
    
    function getIsPaused() public view returns(bool) {
      return isPaused;
    }

    function getBalance(address msgSender) public view returns(uint256) {
      return users[msgSender].balance;
    }

    function getBetAmount(address msgSender) public view returns(uint256) {
      return users[msgSender].betAmount;
    }

    function getBetStatus(address msgSender) public view returns(bool) {
      return users[msgSender].hasBetted;
    }

    function getChosenBet(address msgSender) public view returns(BetChoice) {
      return users[msgSender].chosenBet;
    }

    function getWinningStatus(address msgSender) public view returns(bool) {
      return users[msgSender].hasWon;
    }
    /**
     *function getUnderlying() public view returns(string memory) {
     * return bet.underlying;
     *}
    **/
    function getStrikePrice() public view returns(uint256) {
      return bet.strikePrice;
    }
    function getCreateTime() public view returns(uint256) {
      return bet.createTime;
    }
    function getEndTime() public view returns(uint256) {
      return bet.endTime;
    }
    function getOutcome() public view returns(BetChoice) {
      return bet.outcome;
    }
    function getTotalPot() public view returns(uint256) {
      return bet.totalPot;
    }
    function getBetterCount() public view returns(uint256) {
      return bet.betterCount;
    }
    function getUpCount() public view returns(uint256) {
      return bet.upCount;
    }
    function getDownnCount() public view returns(uint256) {
      return bet.downCount;
    }
    function getWinnerCount() public view returns(uint256) {
      return bet.winnerCount;
    }
    function getStatus() public view returns(BetStatus) {
      return bet.status;
    }
    function getIsLive() public view returns(bool) {
      return bet.isLive;
    }

    /// Circuit Breakers - for Emergency use only!
    function pauseBet() external onlyOwner notPaused betIsLive {
      isPaused = true;
      emit LogPauseBet();
    }

    function resumeBet() external onlyOwner paused {
      isPaused = false;
      emit LogResumeBet();
    }

    /// State getter for React front event handling method calls
    function getUserAndBetStates(address msgSender) public view returns (
          uint256 balance,
          uint256 betAmount,
          bool hasWon,
          BetChoice outcome,
          uint256 totalPot,
          uint256 betterCount,
          uint256 upCount,
          uint256 downCount,
          uint256 winnerCount
        )
    {
        balance = users[msgSender].balance;
        betAmount = users[msgSender].betAmount;
        hasWon = users[msgSender].hasWon;
        outcome = bet.outcome;
        totalPot = bet.totalPot;
        betterCount = bet.betterCount;
        upCount = bet.upCount;
        downCount = bet.downCount;
        winnerCount = bet.winnerCount;

        return ( balance, betAmount, hasWon, outcome, totalPot, betterCount, upCount, downCount, winnerCount );
    }

    /// State getter for React front event handling method calls
    function getBetStartEndTimes() public view returns (uint256 createTime, uint256 endTime){
        createTime = bet.createTime;
        endTime = bet.endTime;

        return (createTime, endTime);
    }

    /// State getter for React front event handling method calls
    function getUserDetails(address msgSender) public view returns (
          uint256 balance,
          uint256 betAmount,
          bool hasBetted,
          BetChoice chosenBet,
          bool hasWon
        )
    {
        balance = users[msgSender].balance;
        betAmount = users[msgSender].betAmount;
        hasBetted = users[msgSender].hasBetted;
        chosenBet = users[msgSender].chosenBet;
        hasWon = users[msgSender].hasWon;

        return (balance, betAmount, hasBetted, chosenBet, hasWon);
    }

    /// State getter for React front event handling method calls
    function getBetDetails() public view returns (
          uint256 strikePrice,
          uint256 createTime,
          uint256 endTime,
          BetChoice outcome,
          uint256 totalPot,
          uint256 betterCount,
          uint256 upCount,
          uint256 downCount,
          uint256 winnerCount,
          BetStatus status,
          bool isLive
        )
    {
        strikePrice = bet.strikePrice;
        createTime = bet.createTime;
        endTime = bet.endTime;
        outcome = bet.outcome;
        totalPot = bet.totalPot;
        betterCount = bet.betterCount;
        upCount = bet.upCount;
        downCount = bet.downCount;
        winnerCount = bet.winnerCount;
        status = bet.status;
        isLive = bet.isLive;

        return (strikePrice, createTime, endTime, outcome, totalPot, betterCount, upCount, downCount, winnerCount, status, isLive);
    }

    // ***********************************************************
    //   Functions to handle market data - with the use of oracle
    // ***********************************************************
    function getCurrPriceFromOracle() public returns(uint256){
      currPrice = 657;   // Use an arbitrary number for initial testing purpose, without oracle usage.

      //bool ok;
      // Need to use the right function call to get stock price from Rhombus Lighthouse oracle
      //(bet.currPrice,ok) = myLighthouse.peekData();
      return currPrice;
    }

    // Call oracle and reveal the final official price for all players who bet on this round;
    // Those who made the correct predication will receive their win (overall bet pool for this round
    // minus fees, then divided by 3 of winners). Those who made wrong prediction will lose all deposit
    function getFinalPriceFromOracle() public returns(uint256){
      finalPrice = 880;    // Use an arbitrary number for initial testing purpose, without oracle usage.

      //bool ok;
      // Need to use the right function call to get stock price from Rhombus Lighthouse oracle
      //(bet.finalPrice,ok) = myLighthouse.peekData();
      return finalPrice;
    }

    /**
    /*   Functions to handle user funding transactions
    /*     TODO -- Move some logic here to offchain to save gas!!
    **/ 
    /// WORKING :))
    function userDeposit(address msgSender) external payable notPaused {
      require( numAccounts < 5, "Already reached max number of betters allowed. Try again later!" );
      uint256 amount = msg.value;
      require( amount > 0, "Error: Cannot deposit zero Ether" );
      
      bool userExists = false;
      /// Check if existing user. Take deposit and update user balance
      for(uint i = 0; i < numAccounts; i++){
        if( userAccounts[i] == msgSender){
          userExists = true;
          users[msgSender].balance = users[msgSender].balance.add(amount);
          break;
        }
      }
      /// Create user account for new user. Take deposit and update user balance
      if(userExists == false){       
        userAccounts[numAccounts] = msgSender; 
        users[msgSender] = User(amount, 0, false, BetChoice.NA, false);        
        numAccounts = numAccounts.add(1);
      }
      emit LogUserDeposit(msgSender, amount);
    }

    /// NOT WORKING :(((
    function userWithdraw(address payable msgSender) external notPaused {
      require( users[msgSender].balance > 0, "Error: Cannot withdraw, zero balance" );

      uint256 amount = users[msgSender].balance;
      /// Change state before sending - to prevent re-entrancy attack!
      users[msgSender].balance = 0;

      (bool success, ) = msgSender.call.value(amount).gas(30000)("");
        /// New syntax below (0.6.4+), fallback function logs withdraw in a storage write, requires 20000 gas
        ///   msgSender.call{gas: 20000, value: amount}("");
      require(success);
 
      emit LogUserWithdraw(msgSender, amount);
    }

    /**
     *   Functions to handle betting transactions
    **/
    /*  TODO -- Implement passing more bet settings through function call later -- 
      function createBet(string _underlying, uint256 _strikePrice, uint _endTime) public onlyOwner {
      bet = Bet(_underlying, _strikePrice, block.timestamp, _endTime, 0, 0, 0, BetStatus.STARTED);
    } */
    /// WORKING :))
    function createBet(uint256 _strikePrice) public onlyOwner notPaused {
      bet.strikePrice = _strikePrice;
      bet.createTime = block.timestamp;
      bet.endTime = block.timestamp + 1 hours;
      bet.status = BetStatus.STARTED;
      bet.isLive = true;

      emit LogCreateBet(msg.sender, _strikePrice);
    }

    /// WORKING :))
    function userTakeBet(address msgSender, BetChoice _choice) external notPaused betIsLive {
      uint256 currTime = block.timestamp;
      require( currTime < bet.endTime, "Error: Bet is already closed" );
      /// TODO -- Temporarily hard-coded user betting amount. To be changed later.
      uint256 weiAmount = 1 ether;
      require( users[msgSender].balance >= weiAmount, "Error: Not sufficient fund in wallet" );
      require( !users[msgSender].hasBetted, "Error: Already betted" );

      users[msgSender].hasBetted = true;
      users[msgSender].balance = users[msgSender].balance.sub(weiAmount);
      users[msgSender].betAmount = users[msgSender].betAmount.add(weiAmount);
      users[msgSender].chosenBet = _choice;
      bet.totalPot = bet.totalPot.add(users[msgSender].betAmount);
      bet.betterCount = bet.betterCount.add(1);
      if (_choice == BetChoice.Above) { bet.upCount = bet.upCount.add(1); }
      else if (_choice == BetChoice.Below) { bet.downCount = bet.downCount.add(1); }

      emit LogUserTakeBet(msgSender, _choice);
    }

    function closeBet() public onlyOwner notPaused betIsLive {
      bet.status = BetStatus.CLOSED;

      emit LogCloseBet(msg.sender);
    }

    function resolveBet() public onlyOwner notPaused betIsLive {
      bet.status = BetStatus.RESOLVED;
      bet.isLive = false;
      setBetOutcome();
      setBetPayout();

      emit LogResolveBet(msg.sender, bet.strikePrice, finalPrice, bet.outcome);
      emit LogSetBetPayout(msg.sender, bet.totalPot, bet.winnerCount);
    } 

    function setBetOutcome() internal onlyOwner {
      finalPrice = getFinalPriceFromOracle();

      if (finalPrice >= bet.strikePrice){ bet.outcome = BetChoice.Above; } 
      else if (finalPrice < bet.strikePrice){ bet.outcome = BetChoice.Below; }
    
      for(uint i = 0; i < numAccounts; i++){  
        if( users[userAccounts[i]].betAmount > 0 && users[userAccounts[i]].chosenBet == bet.outcome ){ 
          users[userAccounts[i]].hasWon = true;
          bet.winnerCount = bet.winnerCount.add(1);
        }
        users[userAccounts[i]].betAmount = 0;
      }
    }  

    /**  
     *  TODO -- Implement bet payout logic (for now just split total pot amongst all winners equally)
     *        Also need to implement fees deduction later
    **/
    function setBetPayout() internal onlyOwner { 
      uint256 payout = 0;
      if (bet.winnerCount > 0) {
        payout = bet.totalPot.div(bet.winnerCount);
      }

      for(uint i = 0; i < numAccounts; i++){
        if( users[userAccounts[i]].hasWon ){ 
          users[userAccounts[i]].balance = users[userAccounts[i]].balance.add(payout);
        }       
      }
    }

    /// TODO -- Implement Bet Factory & preserve betting history. Then no need to reset.
    function resetBet() public onlyOwner {    
      //currPrice = 0;
      finalPrice = 0;

      //bet.betId = "";
      //bet.underlying = "";
      bet.strikePrice = 0;
      bet.createTime = 0;
      bet.endTime = 0;
      bet.outcome = BetChoice.NA;
      bet.totalPot = 0;
      bet.betterCount = 0;
      bet.upCount = 0;
      bet.downCount = 0;
      bet.winnerCount = 0;
      bet.status = BetStatus.NOT_STARTED;
      bet.isLive = false;

      emit LogResetBet(msg.sender);
    }

}