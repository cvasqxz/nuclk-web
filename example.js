"use strict";

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const evmChains = window.evmChains;

let web3Modal
let provider;
let selectedAccount;
let selectedENS;

function init() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: { infuraId: "8043bb2cf99347b1bfadfb233c5325c0" }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
    disableInjectedProvider: false,
  });
}

async function fetchAccountData() {
  document.querySelector("#btn-connect").className = "button is-rounded is-white is-large is-size-2 is-loading";

  const web3 = new Web3(provider);
  const chainId = await web3.eth.getChainId();
  const chainData = evmChains.getChain(chainId);
  document.querySelector("#network-name").textContent = chainData.name;

  const accounts = await web3.eth.getAccounts();
  selectedAccount = accounts[0];

  var ensCall = web3.eth.abi.encodeFunctionCall({
    name: 'getNames',
    type: 'function', 
    inputs: [{ type: 'address[]', name: 'addresses' }]
  }, [accounts]);

  ensCall = await web3.eth.call({
    "to": "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C",
    "data": ensCall
  });

  const ensAccounts = web3.eth.abi.decodeParameter('string[]', ensCall);
  selectedENS = ensAccounts[0];

  if (selectedENS.includes(".eth")) {
    document.querySelector("#selected-account").textContent = selectedENS;
  } else {
    document.querySelector("#selected-account").textContent = selectedAccount;
  }

  const balance = await web3.eth.getBalance(selectedAccount);
  const ethBalance = web3.utils.fromWei(balance, "ether");
  const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
  document.querySelector("#account-balance").textContent = humanFriendlyBalance;

  // Display fully loaded UI for wallet data
  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#connected").style.display = "block";

  document.querySelector("#btn-connect").className = "button is-rounded is-white is-large is-size-2";
}


async function refreshAccountData() {
  document.querySelector("#connected").style.display = "none";
  document.querySelector("#prepare").style.display = "block";

  document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
  await fetchAccountData(provider);
  document.querySelector("#btn-connect").removeAttribute("disabled")
}


async function onConnect() {

  try {
    provider = await web3Modal.connect();
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  provider.on("accountsChanged", (accounts) => { fetchAccountData(); });
  provider.on("chainChanged", (chainId) => { fetchAccountData(); });

  await refreshAccountData();
}


async function onDisconnect() {
  if(provider.close) {
    await provider.close();
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;

  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
}

window.addEventListener('load', async () => {
  init();
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document.querySelector("#btn-disconnect").addEventListener("click", onDisconnect);
});
