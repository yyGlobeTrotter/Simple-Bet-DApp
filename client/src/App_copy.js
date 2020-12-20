import React, { Component } from "react";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import SimpleBetContract from "./contracts/SimpleBet.json";
import getWeb3 from "./getWeb3";
import "./App.css";

import logo from "./SimpleBet_Logo.png";
import { Box, Button, Heading, Table, Avatar, MetaMaskButton } from 'rimble-ui';
//import { ToastMessage, Input, Select, EthAddress } from 'rimble-ui';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = { 
      isOwner: false, 
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

  componentDidMount = async () => {
    setInterval(() => {
      this.setState({
        curTime : new Date().toLocaleString()
      })
    }, 1000)

    try {
      // Get web3 instance, network provider, and contract instance
      const web3 = await getWeb3();                     
      const accounts = await web3.eth.getAccounts();    
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleBetContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleBetContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      // Set web3, accounts, and contract to the state. Then proceed with interacting with 
      //   the contract's methods to set local state of smart contract values
      this.setState({ web3, accounts, contract: instance }, this.checkOwnerAndGetInitState);
    } catch (error) {     // Catch any errors for any of the above operations
      alert(
        `Failed to load web3, accounts, contract, or other state variables. Check console for details.`,
      );   
      console.error(error);
    }
  };

  checkOwnerAndGetInitState = async () => {
    const { accounts, contract } = this.state;

    //const isOwner = await contract.methods.isOwner(accounts[0]).call({ from: accounts[0] });
    //let temp = (result.localeCompare(accounts[0]) === 0);
   /* const isOwner = await contract.methods.owner().call();
    if (isOwner) {
      this.setState({ isOwner : true });
    } else {
      this.setState({ isOwner : false });
    } */
    this.setState({ isOwner : false });
    //console.log('isOwner? ', isOwner);

    //await contract.methods.setCurrPriceUsingOracle().send({ from: accounts[0] });
    const solidityCreateTime = await contract.methods.getCreateTime().call();
    const solidityEndTime = await contract.methods.getEndTime().call();
    const currPrice = await contract.methods.getCurrPrice().call();

    const balance = await contract.methods.getBalance(accounts[0]).call()/(10**18);  // Convert from wei to Ether
    const betAmount = await contract.methods.getBetAmount(accounts[0]).call()/(10**18);  // Convert from wei to Ether
    const betStatus = await contract.methods.getStatus().call();

    this.setState({ currPrice, balance, betAmount, isBetLive : (betStatus === 1) });
    this.setState({
      createTime : new Date(solidityCreateTime * 1000).toLocaleString(),
      endTime : new Date(solidityEndTime * 1000).toLocaleString(),
    });
  }

  handleCreateBet(event) {
    const { accounts, contract, strikePrice } = this.state;

      // Implement getting strikePrice from Input Field later. Hard code for now
    contract.methods.createBet(strikePrice).send({ from: accounts[0] }).then(result => {
      console.log(`Got createBet() result: ${result}`);
      return  this.setState({ isBetLive: result });
    }).catch(error => {
      console.error(error);
    });
  }

  handleCloseBet(event) {  
    const { accounts, contract } = this.state;

    contract.methods.closeBet().send({ from: accounts[0] }).then(result => {
      console.log(`Got closeBet() result: ${result}`);
      return this.setState({ isBetLive: result });
    }).catch(error => {
      console.error(error);
    });
  }

  handleDeposit(event) {
    const { accounts, contract } = this.state;
    
    let depositAmount = (10**18) * prompt('Please enter your deposit amount in Ether:');  // Convert from Ether to wei

    contract.methods.userDeposit(accounts[0]).send({ from: accounts[0], value: depositAmount }).then(result => {
      console.log(`Got userDeposit call result: ${result}`);
      return contract.methods.getBalance(accounts[0]).call();
    }).then(result => {
      console.log(`Got user balance: ${result}`);
      return this.setState({ balance: result / (10**18) });   // Convert from wei to Ether
    });
  }

  handleBet(event) {
    const { accounts, contract } = this.state;
    //const betAmount = 1;         // Forcing 1 Ether per bet for now...
    let choice = 3;
    if (event.target.id === "Up") { 
      choice = 0; 
    } else if (event.target.id === "Down") { 
      choice = 1; 
    } else if (event.target.id === "Even") { 
      choice = 2; 
    }

    contract.methods.takeBet(accounts[0], choice).send({ from: accounts[0] }).then(result => {
      console.log(`Got takeBet call result: ${result}`);
      return contract.methods.getBalance(accounts[0]).call();
    }).then(result => {
      console.log(`Got user balance: ${result}`);
      return this.setState({ balance: result / (10**18) });   // Convert from wei to Ether
    }).then(result => {
      return contract.methods.getBetAmount(accounts[0]).call();
    }).then(result => {
      console.log(`Got user betAmount: ${result}`);
      return this.setState({ betAmount: result / (10**18) });   // Convert from wei to Ether
    }).catch(error => {
      console.error(error);
    });
  }

  // Actual UI display that users can see and interact with
  render() {
    setInterval(function(){this.setState({curTime: new  Date().toLocaleString()});}.bind(this), 1000);

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">

        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
        </header>
        <Box bg="salmon" color="white" px={3}>
          <Heading as={"h1"}>Welcome to Yue's ETH Betting DApp! </Heading>
        </Box>

  {!this.state.isOwner ? 
        <div>
          <Box px={2} width={1}>  
            <table>
              <tbody>
                <tr>
                  <td><Avatar src="https://airswap-token-images.s3.amazonaws.com/ETH.png"/></td>
                  <td><Heading>{this.state.underlying} Price Betting Rules:</Heading></td>
                </tr>
                  <tr>
                    <td>  </td>
                    <td>
                      <b>Rule #1</b> - You must deposit some Ether (via MetaMask) before placing a bet...  <MetaMaskButton.Outline size="small">Connect with MetaMask</MetaMaskButton.Outline>
                    </td>
                  </tr>
                  <tr>
                    <td>  </td>
                    <td><b>Rule #2</b> - You can only bet 1 Ether for now; You can only place 1 bet at a time</td>
                  </tr>
                  <tr>
                    <td>  </td>
                    <td><b>Rule #3</b> - 3 bet choices: Final Price goes above Strike Price, goes below, or stays the same</td>
                  </tr>
                  <tr>
                    <td>  </td>
                    <td><b>Rule #4</b> - Final price for this bet is the EOD price of {this.state.underlying} at the end of Dec 2020, by Coinbase</td>
                  </tr>
                  <tr>
                    <td>  </td>
                    <td><b>Rule #5</b> - You cannot change your bet. Result will be announced after Fina Price is ready</td>
                  </tr>
                </tbody>
            </table>
          </Box>
        </div>  
  : <p></p>}

        <p></p>
        <div> 
          <Box px={2} width={[1/8, 1/8, 1/8, 1/8, 1/8, 1/8, 1/8]}>        
            <Table borderColor="DarkCyan">
              <thead>
                <tr>                  
                  <th>Strike Price</th>
                  <th>Current Price</th>
                  <th>Create Time</th>
                  <th>End Time</th>
                  <th>Current Timestamp</th>
                  <th>Wallet Balance</th>
                  <th>Bet Amount</th>
                  <th>Winning Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{this.state.strikePrice > 0 ? <b>{this.state.strikePrice}</b> : "N/A"}</td>
                  <td>{this.state.currPrice > 0 ? <b>{this.state.currPrice}</b> : "N/A"}</td> 
                  <td>{this.state.createTime > 0 ? <i>{this.state.createTime}</i> : "N/A"}</td>
                  <td>{this.state.endTime > 0 ? <i>{this.state.endTime}</i> : "N/A"}</td>
                  <td><i>{this.state.curTime}</i></td>
                  <td><b>{this.state.balance}</b> ETH</td>
                  <td><b>{this.state.betAmount}</b> ETH</td>                 
                  <td>{this.state.hasWon ? "You Won!" : "N/A"}</td>                  
                </tr>
              </tbody>
            </Table>
          </Box>
         </div> 

  {!this.state.isBetLive && this.state.isOwner ? 
        <div>
          <Box px={2}>  
            <table>
              <tbody>
                <tr>
                  <td>  </td>
                  <td><Heading as={"h4"}>Bet hasn't been created. Please create a new bet:</Heading></td>
                </tr>
                <tr>
                  <td>  </td>
                  <td><Button size={'medium'} onClick={this.handleCreateBet.bind(this)}>Create Bet</Button></td>
                </tr>
              </tbody>
            </table>
          </Box>
        </div> 
  : <p></p>}
  {this.state.isBetLive && this.state.isOwner ? 
        <div>
          <Box px={2}>  
            <table>
              <tbody>
                <tr>
                  <td>  </td>
                  <td><Heading as={"h4"}>Bet is live! Click the button below to close it:</Heading></td>
                </tr>
                <tr>
                  <td>  </td>
                  <td><Button size={'medium'} onClick={this.handleCloseBet.bind(this)}>Close Bet</Button></td>
                </tr>
              </tbody>
            </table>
          </Box>
        </div> 
  : <p></p>}

  {this.state.balance <= 0 && this.state.betAmount <= 0 && !this.state.isOwner ? 
        <div>
          <Box px={2}>  
            <table>
              <tbody>
                <tr>
                  <td>  </td>
                  <td><Heading as={"h2"}>Ready to bet? Drop some Ether first!</Heading></td>
                </tr>
                <tr>
                  <td>  </td>
                  <td><Button size={'medium'} onClick={this.handleDeposit.bind(this)}>Make a Deposit!</Button></td>
                </tr>
              </tbody>
            </table>
          </Box>
        </div> 
  : <p></p>}

  {this.state.balance > 0 && this.state.betAmount <= 0 && !this.state.isOwner ? 
        <div>
          <Box px={2}>  
            <table>
              <tbody>
                <tr>
                  <td>  </td>
                  <td><Heading as={"h2"}>Woo! You have $$ to bet, let's roll!</Heading></td>
                </tr>
                  <tr>
                    <td>  </td>
                    <td>
                      <Button id="Up" variant="success" size={'medium'} marginRight={5} onClick={this.handleBet.bind(this)}>Above</Button>
                      <Button id="Down" variant="danger" size={'medium'} marginRight={5} onClick={this.handleBet.bind(this)}>Below</Button>
                      <Button id="Even" mainColor="DarkCyan" size={'medium'} onClick={this.handleBet.bind(this)}>Same</Button>
                    </td>
                  </tr>
                </tbody>
            </table>
          </Box>
        </div>
  : <p></p>}

      </div>
    );
  }
}

export default App;
