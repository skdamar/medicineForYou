import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";
import Web3 from 'web3';
import ipfs from './ipfs';

import "./App.css";

class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null, buffer:null, value:'', ipfsHash:''};

  async loadWeb3() {
    if (window.ethereum){
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    } if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else{
      window.alert("Please use MetaMask")
    }
  }

  async componentWillMount(){
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData(){
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({account : accounts[0]})
    console.log(accounts)
    const networkId = await web3.eth.net.getId()
    console.log(networkId)  
    const networkData = SimpleStorageContract.networks[networkId]

    if(networkData) {
      const abi = SimpleStorageContract.abi
      const address = networkData.address
      const contract = new web3.eth.Contract(abi, address)
      this.setState({ contract })
      console.log(contract)
      const ipfsHash = await contract.methods.get().call()
      this.setState({ipfsHash})
      console.log(ipfsHash)
    } else {
      window.alert('Smart contract not deployed to detected network.')
    }

  }
  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      this.handleChange = this.handleChange.bind(this);
      this.onSubmit = this.onSubmit.bind(this);


      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };


  // runExample = async () => {
  //   const { accounts, contract } = this.state;

  //   // Stores a given value, 5 by default.
  //   await contract.methods.set(5).send({ from: accounts[0] });

  //   // Get the value from the contract to prove it worked.
  //   const response = await contract.methods.get().call();

  //   // Update state with the result.
  //   this.setState({ storageValue: response });
  // };

  handleChange(event) {
    event.preventDefault()
    this.setState({value: event.target.value});
  }

  onSubmit(event){
    event.preventDefault()
    this.setState({buffer: Buffer(this.state.value)})
    console.log('buffer', this.state.buffer)
    ipfs.files.add(this.state.buffer, (error, result)=> {
      if(error){
        console.log(error)
        return
      }
      const ipfsHash =  result[0].hash
      this.setState({ ipfsHash })
      this.state.contract.methods.set(ipfsHash).send({from: this.state.account}).then((r) => {
        this.setState({ ipfsHash })
      })
      // this.setState({ ipfsHash: result[0].hash})
      // alert('Submitted. Your IPFS Hash:'+ this.state.ipfsHash)
    })
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Medicine For You</h1>
        <h2>This transaction is stored on IPFS & The Ethereum Blockchain!</h2>
        <h2>Confirmation</h2>
        <ul className="navbar-nav px-3">
          <p className="nav-item text-nowrap d-none d-sm-none d-sm-block">
            <small>Delivery account: {this.state.account}</small>
          </p>
          <p>From ABC Hospital</p>
          <p>Medicine A: 5</p>
          <p>Delivery Address: 23, Phan Chau Trinh, Da Nang, Vietnam</p>
        </ul>
        <h2>Receiver</h2>
        <form onSubmit={this.onSubmit}>
          <input type="text" onChange={this.handleChange} value={this.state.value}/>
          <br></br>
          <input type="submit"/>
        </form>
      </div>
    );
  }
}

export default App;
