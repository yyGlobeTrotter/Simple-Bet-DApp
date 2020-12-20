SPDX-License-Identifier: MIT

import React, { Component } from "react";
import ReactTimeout from 'react-timeout';
import { Box, Flex, Card, Button, Heading, Table, Input, Radio, Avatar, Flash } from 'rimble-ui';

import SimpleBetContract from "./contracts/SimpleBet.json";
import getWeb3 from "./getWeb3";
import "./App.css";
import logo from "./SimpleBet_Logo.png";

class App extends Component {
/// Frst Step - Constructor
  constructor(props) {
    super(props);
    this.state = { 
      isOwner: null,
      isPaused: null,

      underlying: "ETHUSD", 
      currPrice: null,
      finalPrice: null,

      balance: 0, 
      betAmount: 0, 
      hasBetted: null,
      chosenBet: null,
      hasWon: null, 

      strikePrice: "", 
      createTime: null, 
      endTime: null,
      outcome: null,
      totalPot: 0,
      betterCount: 0,
      upCount: 0,
      downCount: 0,
      winnerCount: 0,
      status: null,
      isLive: null,
      isBettingClosed: null,

      currTime: null,
      web3: null,
      accounts: null, 
      contract: null 
    };
    this.onInputchange = this.onInputchange.bind(this);
    this.onSubmitForm = this.onSubmitForm.bind(this);
  }
  onInputchange(event) {
    this.setState({
      [event.target.name]: event.target.value
    });
  }
  onSubmitForm() {
    console.log(this.state);
  }
  
  /**
  /// componentWillMount() is another lifecycle method
  **/
  componentWillUnmount() {
    //clearTimeout(this.timerID);
  }  

  /**
  /// componentDidMount() method runs after the component output has been rendered to the DOM
  **/
  componentDidMount = async () => {
    // Set currTime to state, will display as the current timestamp
    setInterval(() => {
      this.setState({
        currTime : new Date().toLocaleString()
      })
    }, 1000); 

    //this.setTimeout(this.handleClose, 5000) // call the `handleCloseBet` function after 5000ms

    /* An example to show how to set up an auto timer
    this.timerID = setInterval(
      () => this.tick(),
      1000
    ); */
    
    /// Get web3 instance, network provider, and contract instance. Then set state
    try {
      const web3 = await getWeb3();                     
      const accounts = await web3.eth.getAccounts();
      /*      // Rinkeby Testnet Network
          const contractAddress = "0x....";
              // Get the contract instance.
          const instance = new web3.eth.Contract(
            SimpleBetContract.abi,
            contractAddress
          );
      */
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleBetContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleBetContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      this.setState({ web3, accounts, contract: instance }, this.checkOwnerAndSetInitState);
    } catch (error) {
      alert(
        `Failed to load web3, accounts, contract, or other state variables. Check console for details.`,
      );   
      console.error(error);
    };
  }

  checkOwnerAndSetInitState = async () => {
    const { accounts, contract } = this.state;

    contract.methods.isOwner(accounts[0]).call({ from: accounts[0] }).then(result => {
      console.log(`Got isOwner call result: ${result}`);
      this.setState({ isOwner: result });
    });

    this.setUserDetailsState();
    const isPaused = await contract.methods.getIsPaused().call();
    const currPrice = await contract.methods.getCurrPrice().call();
    const finalPrice = await contract.methods.getFinalPrice().call();
    let chosenBet = await contract.methods.getChosenBet(accounts[0]).call();
    
    /// enum data type returns a string, not integer!!!
    if(chosenBet === "0") { 
      chosenBet = 'N/A'; 
    } else if(chosenBet === "1") { 
      chosenBet = 'Above';
    } else {
      chosenBet = "Below";
    };
    this.setState({ isPaused, currPrice, finalPrice, chosenBet });

    this.setBETDetailsState();
    let outcome = await contract.methods.getOutcome().call();
    let status = await contract.methods.getStatus().call();
    let isBettingClosed = true;

    /// enum data type returns a string, not integer!!!
    if(outcome === "0") { 
      outcome = 'N/A'; 
    } else if(outcome === "1") { 
      outcome = 'Above';
    } else {
      outcome = "Below";
    };

    if(status === "0") {
      status = 'NOT_STARTED'; 
    } else if(status === "1") { 
      status = 'STARTED';
      isBettingClosed = false;
    } else if(status === "2") { 
      status = 'CLOSED';      
    } else{
      status = 'RESOLVED';
    };
    this.setState({ outcome, status, isBettingClosed });
  }

  setUserDetailsState = async () => {
    const { accounts, contract } = this.state;
    const userDetails = await contract.methods.getUserDetails(accounts[0]).call();

    this.setState({ 
      balance: userDetails.balance / (10**18),
      betAmount: userDetails.betAmount / (10**18),
      hasBetted: userDetails.hasBetted,
      hasWon: userDetails.hasWon,
    });
    console.log('Set state for user details');
  }

  setBETDetailsState = async () => {
    const { contract } = this.state;
    const betDetails = await contract.methods.getBetDetails().call();

    this.setState({ 
      strikePrice: betDetails.strikePrice,
      createTime: new Date(betDetails.createTime * 1000).toLocaleString(),
      endTime: new Date(betDetails.endTime * 1000).toLocaleString(),
      totalPot: betDetails.totalPot  / (10**18),
      betterCount: betDetails.betterCount,
      upCount: betDetails.upCount,
      downCount: betDetails.downCount,
      winnerCount: betDetails.winnerCount,
      isLive: betDetails.isLive,
    });
    console.log('Set state for bet details');
  }

  /**
   *    The following are event handling functions
   */
  
  /*
   * handleClose = () => {alert('test on timeout!'); }
   */
  /// WORKING :))
  handlePauseBet(event) {  
    const { accounts, contract } = this.state;
    contract.methods.pauseBet().send({ from: accounts[0] }).then(result => {
      console.log(`Got pauseBet.send result: ${result}`);
      return this.setState({ isPaused: true });
    }).catch(error => {
      console.error(error);
    });
  }

  /// WORKING :))
  handleResumeBet(event) {  
    const { accounts, contract } = this.state;
    contract.methods.resumeBet().send({ from: accounts[0] }).then(result => {
      console.log(`Got resumeBet.send result: ${result}`);
      return this.setState({ isPaused: false });
    }).catch(error => {
      console.error(error);
    });
  }

  /// WORKING :))
  handleCreateBet(event) {
    const { accounts, contract, strikePrice } = this.state;

    contract.methods.createBet(strikePrice).send({ from: accounts[0] }).then(result => {
      console.log(`Got createBet.send result: ${result}`);
      return contract.methods.getBetStartEndTimes().call();
    }).then(result => {
      console.log(`Got getBetStartEndTimes.call result: ${result}`);
      return this.setState({ 
        createTime: new Date(result.createTime * 1000).toLocaleString(),
        endTime: new Date(result.endTime * 1000).toLocaleString(),
        status: "STARTED",
        isLive: true,
        isBettingClosed: false
      });                
    }).catch(error => {
      console.error(error);
    });
  }

  /// WORKING :))
  handleCloseBet(event) {  
    const { accounts, contract } = this.state;
    contract.methods.closeBet().send({ from: accounts[0] }).then(result => {
      console.log(`Got closeBet.send result: ${result}`);
      return this.setState({ status: "CLOSED", isBettingClosed: true });
    }).catch(error => {
      console.error(error);
    });
  }

  /// WORKING :))
  handleResolveBet(event) {
    const { accounts, contract } = this.state;

    contract.methods.resolveBet().send({ from: accounts[0] }).then(result => {
      console.log(`Got resolveBet.send result: ${result}`);
      return contract.methods.getFinalPrice().call();
    }).then(result => {
      console.log(`Got getFinalPrice.call result: ${result}`);
      this.setState({ finalPrice: result, status: "RESOLVED", isLive: false, });
      return contract.methods.getUserAndBetStates(accounts[0]).call();
    }).then(result => {
      console.log(`Got getUserAndBetStates.call result: ${result}`);
      return this.setState({    
        balance: result.balance / (10**18),
        betAmount: result.betAmount / (10**18),
        hasWon: result.hasWon,
        outcome: result.outcome,
        winnerCount: result.winnerCount,
      });                
    }).catch(error => {
      console.error(error);
    }); 
  }

  /// TODO -- Reset user state (hasBetted, chosenBet and hasWon) later
  handleResetBet(event) {  
    const { accounts, contract } = this.state;
  
    contract.methods.resetBet().send({ from: accounts[0] }).then(result => {
      console.log(`Got resetBet.send result: ${result}`);
      return this.setState({
        finalPrice: null,
        strikePrice: null,
        createTime: null,
        endTime: null,
        outcome: null,
        totalPot: 0,
        betterCount: 0,
        upCount: 0,
        downCount: 0,
        winnerCount: 0,
        status: "NOT_STARTED", 
        isLive: false 
      });
    }).catch(error => {
      console.error(error);
    });
  }

  /// WORKING :))
  handleUserDeposit(event) {
    const { accounts, contract } = this.state;   
    let depositAmount = (10**18) * prompt('Please enter your deposit amount in Ether:');  // Convert from Ether to wei
    contract.methods.userDeposit(accounts[0]).send({ from: accounts[0], value: depositAmount }).then(result => {
      console.log(`Got userDeposit.send result: ${result}`);
      return contract.methods.getBalance(accounts[0]).call();
    }).then(result => {
      console.log(`Got getBalance.call result: ${result}`);
      return this.setState({ balance: result / (10**18) });   // Convert from wei to Ether
    }).catch(error => {
      console.error(error);
    });
  }

  /// WORKING :))
  handleUserWithdraw(event) {  
    const { accounts, contract } = this.state;
    contract.methods.userWithdraw(accounts[0]).send({ from: accounts[0] }).then(result => {
      console.log(`Got userWithdraw.send result: ${result}`);
      return contract.methods.getBalance(accounts[0]).call();
    }).then(result => {
      console.log(`Got getBalance.call result: ${result}`);
      return this.setState({ balance: result / (10**18) });
    }).catch(error => {
      console.error(error);
    });
  }

  /// WORKING :))
  handleUserTakeBet(event) {
    const { accounts, contract } = this.state;
      /// Forcing 1 Ether per bet for now. Implement user input bet amount later!
    let tmp = event.target.id;
    let choice = 0;
    if (tmp === 'Above') { 
      choice = 1; 
    } else if (tmp === 'Below') { 
      choice = 2; 
    } 
    contract.methods.userTakeBet(accounts[0], choice).send({ from: accounts[0] }).then(result => {
      console.log(`Got userTakeBet.send result: ${result}`);
      return contract.methods.getUserAndBetStates(accounts[0]).call();
    }).then(result => {
      console.log(`Got getUserAndBetStates.call result: ${result}`);
      return this.setState({
        hasBetted: true,
        chosenBet: tmp,
        balance: result.balance / (10**18),
        betAmount: result.betAmount / (10**18),
        totalPot: result.totalPot / (10**18),
        betterCount: result.betterCount,
        upCount: result.upCount,
        downCount: result.downCount
      });                
    }).catch(error => {
      console.error(error);
    }); 
  }


  /// TODO - To be implemented!!
  handleUserCheckStatus(event) {  
    const { accounts, contract } = this.state;
    let tmp = event.target.id;
    /// TODO - Based on "Not_Resolved" or "Resolved" id, call relevant methods and set relevant states
  }

  /*
   *  Actual UI display that users can see and interact with
   */
  render() {
    setInterval(function(){this.setState({currTime: new  Date().toLocaleString()});}.bind(this), 1000);

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    const {
      isOwner,
      isPaused,
      balance,
      betAmount,
      hasBetted,
      chosenBet,
      underlying,
      currPrice,
      strikePrice,
      createTime,
      endTime,
      outcome,
      totalPot,
      betterCount,
      upCount,
      downCount,
      winnerCount,
      status,
      isLive,
      isBettingClosed,
      currTime
    } = this.state;

    const betDesc = `Bet #1: Will the price of ${underlying} trade above Strike Price, or below, on Coinbase, anytime between Jan 1st, 2021 and Jan 31st, 2021?`;
    const NA = "N/A";

    let finalPrice = this.state.finalPrice;
    if (status !== "RESOLVED") { 
      finalPrice = NA; 
    }

    let hasWon = this.state.hasWon;
    if (status !== "RESOLVED") { 
      hasWon = NA; 
    } else {
      if (hasBetted) {
        if (hasWon) { hasWon = "Yes"}
        else { hasWon = "No"}
      } else {
        hasWon = NA;
      }
    }
    
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
        </header>
        <Heading as={"h1"}>Welcome to Yue's Simple Betting DApp v0.1! </Heading>
  {isPaused &&
        <div>
          <Flash my={2} width={2 / 3} variant="danger">
            <b>ALERT!</b> Circuit breaker has been triggered for this DApp. Please wait until further notice. Thank you for your patience.
          </Flash>
    {isOwner &&
          <Box p={2} width={2 / 3}>  
            <table>
              <tbody>
                <tr>
                  <td>  </td>
                  <td><Heading as={"h3"}>Click the button below to stop circuit breaker and resume bet:</Heading></td>
                </tr>
                <tr>
                  <td>  </td>
                  <td>
                    <Button size={'medium'} onClick={this.handleResumeBet.bind(this)}>Resume Betting</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </Box>
    }
        </div> 
  }
  {isOwner && !isPaused &&
        <div>
          <Box p={2} width={2 / 3} color="black" bg="salmon">
            <Heading>OWNER DASHBOARD</Heading>
          </Box>
    {status === "NOT_STARTED" ?
          <Card bg="white" color="salmon" borderColr="black" width={2 / 3} p={2}>
            <Heading as={"h2"}>Choose an Available {underlying} Bet:</Heading>
            <Radio defaultChecked label={betDesc} my={2} />
            <Radio disabled label="Bet #2...currently unavailable" my={2} />
            <Heading as={"h2"}>Enter a Strike Price below then click the button to create a new bet:</Heading>
            <Flex>
              <Box p={2} width={1 / 3} color="white" bg="salmon">
                <Input size={'small'} type="number" required={true} name='strikePrice' placeholder="e.g. 123" value={strikePrice} onChange={this.onInputchange.bind(this)}/>
              </Box>
              <Box p={2} width={1 / 3} color="white" bg="salmon">
                <Button size={'medium'} width={"auto"} onClick={this.handleCreateBet.bind(this)}>Create Bet</Button>    
              </Box>
            </Flex>
          </Card>
    :
          <Card bg="black" color="salmon" borderColr="black" width={2 / 3} p={2}>
            <Heading as={"h3"}>See Detailed Status Below of the {underlying} Bets:</Heading>
            <p>Current Price: {currPrice}<i>  (** This is not a live price **)</i></p>
            <p>Current Time: {currTime}</p>
          </Card>
    }
        </div>
  }
  {isOwner && !isPaused && status !== "NOT_STARTED" &&
        <div>
          <Flex>
            <Box p={0} width={1 / 3} color="salmon" bg="white">       
              <Table>
              <thead>
                <tr>
                  <th>Bet #1</th>
                  <th>Details</th>
                </tr> 
              </thead>
              <tbody>
                <tr>
                  <td><b>Bet Status</b></td>
                  <td><b>{status}</b></td>
                </tr>
                <tr>
                  <td><b>Start Time</b></td>
                  <td>{createTime === endTime ? NA : createTime}</td>
                </tr>
                <tr>
                  <td><b>Close Time</b></td>
                  <td>{endTime === createTime ? NA : endTime}</td>
                </tr>
                <tr>
                  <td><b>Strike Price</b></td>
                  <td><b>{strikePrice <= 0 ? NA : strikePrice}</b></td>
                </tr>
                <tr>   
                  <td><b>Final Price</b></td>   
                  <td><b>{finalPrice <= 0 ? NA : finalPrice}</b></td>
                </tr>
                <tr>   
                  <td><b>Total Confirmed Bets</b></td>
                  <td>{betterCount}</td>
                </tr>
                <tr>   
                  <td><b>Total Bets Above</b></td>
                  <td>{upCount}</td>
                </tr>
                <tr>  
                  <td><b>Total Bets Below</b></td>
                  <td>{downCount}</td>
                </tr>
                <tr> 
                  <td><b>Total Pot</b></td>
                  <td><b>{totalPot}</b> ETH</td>
                </tr>
                <tr>
                  <td><b>Bet Outcome</b></td>
                  <td>{outcome}</td>
                </tr>
                <tr>
                  <td><b>Total Winners</b></td>               
                  <td>{winnerCount}</td>  
                </tr>
                <tr>
        {!isBettingClosed ? 
                  <td><Button mainColor="danger" size={'small'} onClick={this.handleCloseBet.bind(this)}>Close Bet</Button></td>
        :         
                  <td><Button disabled mainColor="danger" size={'small'} onClick={this.handleCloseBet.bind(this)}>Close Bet</Button></td>
        }          
        {status !== "RESOLVED" ?
                  <td><Button mainColor="DarkCyan" size={'small'} onClick={this.handleResolveBet.bind(this)}>Resolve Bet</Button></td>
        :
                  <td><Button disabled mainColor="DarkCyan" size={'small'} onClick={this.handleResolveBet.bind(this)}>Resolve Bet</Button></td>
        }
                </tr>
              </tbody>
              </Table>
            </Box>
            <Box p={0} width={1 / 3} color="salmon" bg="light-gray">       
              <Table>
              <thead>
                <tr>
                  <th>Bet #2</th>
                  <th>Details</th>
                </tr> 
              </thead>
              <tbody>
                <tr>
                  <td><b>Bet Status</b></td>
                  <td><i>{NA}</i></td>
                </tr>
                <tr>
                  <td><b>Start Time</b></td>
                  <td><i>{NA}</i></td>
                </tr>
                <tr>
                  <td><b>Close Time</b></td>
                  <td><i>{NA}</i></td>
                </tr>
                <tr>
                  <td><b>Strike Price</b></td>
                  <td><i>{NA}</i></td>
                </tr>
                <tr>   
                  <td><b>Final Price</b></td>   
                  <td><i>{NA}</i></td>
                </tr>
                <tr>   
                  <td><b>Total Confirmed Bets</b></td>
                  <td><i>{NA}</i></td>
                </tr>
                <tr>   
                  <td><b>Total Bets Above</b></td>
                  <td><i>{NA}</i></td>
                </tr>
                <tr>  
                  <td><b>Total Bets Below</b></td>
                  <td><i>{NA}</i></td>
                </tr>
                <tr> 
                  <td><b>Total Pot Size</b></td>
                  <td><i>{NA}</i></td>
                </tr>
                <tr>
                  <td><b>Bet Outcome</b></td>
                  <td><i>{NA}</i></td>
                </tr>
                <tr>
                  <td><b>Total Winners</b></td>               
                  <td><i>{NA}</i></td> 
                </tr>
                <tr>
                  <td><Button disabled mainColor="danger" size={'small'} onClick={this.handleCloseBet.bind(this)}>Close Bet</Button></td>               
                  <td><Button disabled mainColor="DarkCyan" size={'small'} onClick={this.handleResolveBet.bind(this)}>Resolve Bet</Button></td>
                </tr>
              </tbody>
              </Table>
            </Box>
          </Flex>  
          <Card bg="black" color="salmon" borderColr="black" width={2 / 3} p={2}>
            <Heading as={"h3"}>What would you like to do now?</Heading>
            <Flex>
              <Box p={0} width={1 / 3} color="salmon" bg="black">
                <Button mainColor="danger" size={'medium'} onClick={this.handlePauseBet.bind(this)}>Pause Betting!</Button>
              </Box>          
              <Box p={0} width={1 / 3} color="salmon" bg="black"> 
                <Button disabled mainColor="DarkCyan" size={'medium'} onClick={this.handleCreateBet.bind(this)}>Create New Bet</Button>
              </Box>
      {status === "RESOLVED" &&
              <Box p={0} width={1 / 3} color="salmon" bg="black">
                <Button size={'medium'} onClick={this.handleResetBet.bind(this)}>Reset Bet</Button>
            </Box>
      }
            </Flex>
          </Card>
        </div> 
  }

  {!isOwner && !isPaused &&
        <div>
          <Box p={2} width={2 / 3} color="black" bg="salmon">
            <Heading>USER DASHBOARD</Heading>
          </Box>
          <Card bg="black" color="salmon" borderColr="black" width={2 / 3} p={2}>
            <Heading as={"h3"}>Current Rules for My Simple Betting DApp (v0.1):</Heading>
            <p>
              <b>Rule #1</b> - You can only bet on {underlying} for now. More will be added later<br/>
              <b>Rule #2</b> - You need to make a deposit first before start betting<br/>
              <b>Rule #3</b> - You can only place 1 bet at a time for now. 1 Ether per bet<br/>
              <b>Rule #4</b> - You are not allowed to change your bet after bet Close Time<br/>
              <b>Rule #5</b> - Betting window is 1 hour for now (Close Time is exactly 1 hour after Start Time)<br/>
              <b>Rule #6</b> - Final payout = Toal Pot Size equally divided by Total Winners (for now)
            </p>
          </Card>
    {!isLive && status !== "RESOLVED" &&
        <div>
          <Flash width={2 / 3} my={3} variant="warning">You can't place bet now because it hasn't gone live yet.</Flash>
        </div>
    }
    {isLive && isBettingClosed &&
        <div>
          <Flash width={2 / 3} my={3} variant="warning">Bet is closed. No more bet. Check final result here after bet market end period.</Flash>
        </div>
    }
    {isLive && !isBettingClosed && !hasBetted && balance > 0 &&
        <div>
          <Flash width={2 / 3} my={3} variant="info">You have balance in your wallet. Place a bet now!</Flash>
        </div>
    }
    {isLive && hasBetted && isBettingClosed &&
        <div>
          <Flash width={2 / 3} my={3} variant="info">Make sure to come back later and check if you win!</Flash>
        </div>
    }
    {balance <= 0 &&
        <div>
          <Flash width={2 / 3} my={3} variant="info">Zero balance in your wallet. Make a deposit if you wish.</Flash>
        </div>
    }
    {status === "RESOLVED" && hasBetted &&
        <div>
      {hasWon === "Yes" ?
          <Flash width={2 / 3} my={3} variant="success">Congrats! You have won this bet :) Check Bet Summary and your new Wallet Balance below.</Flash>
      :
          <Flash width={2 / 3} my={3} variant="warning">Oops! You have lost this bet :( Check Bet Summary and your new Wallet Balance below.</Flash>
      }
        </div>
    }
          <Heading as={"h2"}>{hasBetted ? "User Status and Bet #1 Summary:" : "User Status and Bet List"}</Heading>
          <Card bg="black" color="salmon" borderColr="salmon" width={2 / 3} p={2}>
            <Heading as={"h3"}>{betDesc}</Heading>
            <p>Current Price: <b>{currPrice}</b> <i>  (** This is not a live price **)</i></p>
            <p>Current Time: {currTime}</p>
          </Card>
          <Flex>
            <Box p={0} width={1 / 3} color="salmon" bg="light-gray">       
              <Table>
              <thead>
                <tr>
                  <th>User Status</th>
                  <th>Details</th>
                </tr> 
              </thead>
              <tbody>
                <tr>
                  <td><b>Wallet Balance</b></td>
                  <td><b>{balance} ETH</b></td>
                </tr>
                <tr>
                  <td><b>Bet Amount</b></td>
                  <td>{betAmount} ETH</td>
                </tr>
                <tr>
                  <td><b>Has Betted?</b></td>
                  <td>{hasBetted ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td><b>Bet Choice</b></td>
                  <td>{chosenBet}</td>
                </tr>
                <tr>
                  <td><b>Winner?</b></td>
    {status === "RESOLVED" && hasBetted ? 
                  <td><b>{hasWon}</b></td>
    :
                  <td>{hasWon}</td>
    }
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>
                    <Button mainColor="DarkCyan" size={'small'} onClick={this.handleUserDeposit.bind(this)}>Deposit</Button>
                  </td>
                  <td>  
    {balance > 0 ?
                    <Button.Outline size={'small'} onClick={this.handleUserWithdraw.bind(this)}>Withdraw</Button.Outline>             
    :
                    <Button.Outline disabled size={'small'} onClick={this.handleUserWithdraw.bind(this)}>Withdraw</Button.Outline>
    }
                </td>
                </tr>
              </tbody>
              </Table>
            </Box>
            <Box p={0} width={1 / 3} color="salmon" bg="white">       
              <Table>
              <thead>
                <tr>
                  <th><Radio defaultChecked label="Bet #1" my={2} /></th>
                  <th>Details</th>
                </tr> 
              </thead>
              <tbody>
                <tr>
                  <td><b>Underlying</b></td>
                  <td><Avatar size="small" src="https://airswap-token-images.s3.amazonaws.com/ETH.png"/></td>
                </tr>
                <tr>
                  <td><b>Strike Price</b></td>
                  <td><b>{strikePrice <= 0 ? NA : strikePrice}</b></td>
                </tr>
                <tr>
                  <td><b>Status</b></td>
                  <td><b>{status}</b></td>
                </tr>
                <tr>
                  <td><b>Start Time</b></td>
                  <td>{createTime === endTime ? NA : createTime}</td>
                </tr>
                <tr>
                  <td><b>Close Time</b></td>
                  <td>{endTime === createTime ? NA : endTime}</td>
                </tr>
                <tr> 
                  <td><b>Total Pot Size</b></td>
                  <td><b>{totalPot}</b> ETH</td>
                </tr>
                <tr>   
                  <td><b>Total Confirmed Bets</b></td>
                  <td>{betterCount}</td>
                </tr>
                <tr>   
                  <td><b>Total Bets Above</b></td>
                  <td>{upCount}</td>
                </tr>
                <tr>  
                  <td><b>Total Bets Below</b></td>
                  <td>{downCount}</td>
                </tr>
                <tr>   
                  <td><b>Final Price</b></td>   
                  <td><b>{finalPrice <= 0 ? NA : finalPrice}</b></td>
                </tr>
                <tr>
                  <td><b>Bet Outcome</b></td>
                  <td>{outcome}</td>
                </tr>               
    {isLive && !isBettingClosed && !hasBetted && balance > 0 ?
                <tr>
                  <td>
                    <Button id="Above" variant="success" size={'small'} onClick={this.handleUserTakeBet.bind(this)}>Bet Above</Button>
                  </td>               
                  <td>
                    <Button id="Below" variant="danger" size={'small'} onClick={this.handleUserTakeBet.bind(this)}>Bet Below</Button>
                  </td> 
                </tr>
    :
                <tr>
                  <td>
                    <Button disabled id="Above" variant="success" size={'small'} onClick={this.handleUserTakeBet.bind(this)}>Bet Above</Button>
                  </td>               
                  <td>
                    <Button disabled id="Below" variant="danger" size={'small'} onClick={this.handleUserTakeBet.bind(this)}>Bet Below</Button>
                  </td> 
                </tr>
    }
              </tbody>
              </Table>
            </Box>
          </Flex>
    {status !== "RESOLVED" ?
          <Box p={2} width={2 / 3} color="salmon" bg="black">
            <Heading as={"h3"}>Click the Button Below to Refresh Bet Summary and User Status:</Heading>
            <Button disabled id="Not_Resolved" size={'medium'} onClick={this.handleUserCheckStatus.bind(this)}>Refresh</Button>
          </Box>
    :
          <Box p={2} width={2 / 3} color="salmon" bg="black">
            <Heading as={"h3"}>Click the Button Below for a List of Open Bets:</Heading>
            <Button disabled id="Resolved" size={'medium'} onClick={this.handleUserCheckStatus.bind(this)}>
              {hasBetted ? "Bet Again" : "Open Bets"}
            </Button>
          </Box>
    }
        </div>
  }
      </div>
    );
  }
}

//export default App;
export default ReactTimeout(App);
