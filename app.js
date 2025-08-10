const contractAddress = "0xEA561Dd7497500d7Ca445819C6cEb8C30763b811";
const abi = [
  { inputs: [{ internalType: "address", name: "_beneficiary", type: "address" }], stateMutability: "nonpayable", type: "constructor" },
  { stateMutability: "payable", type: "receive" },
  { inputs: [], name: "beneficiary", outputs: [{ internalType: "address", name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getBalance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getTopDonors", outputs: [{ internalType: "address[3]", name: "", type: "address[3]" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "release", outputs: [], stateMutability: "nonpayable", type: "function" }
];

let provider;
let signer;
let contract;
let web3Modal;

function init() {
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider.default,
      options: {
        infuraId: "499eccaaa1c34321be3edd18295da9fa"  // <- сюди встав свій Infura Project ID
      }
    }
  };

  web3Modal = new window.Web3Modal.default({
    cacheProvider: false,
    providerOptions
  });
}

function shortAddress(address) {
  if (!address) return "";
  return address.slice(0, 6) + "..." + address.slice(-4);
}

async function connect() {
  try {
    const externalProvider = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(externalProvider);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, abi, signer);

    const userAddress = await signer.getAddress();
    alert("Wallet connected: " + shortAddress(userAddress));
    document.getElementById("walletAddress").innerText = userAddress;
    
    // Можна додати оновлення балансу чи інших даних тут

  } catch (err) {
    alert("Connection failed: " + err.message);
    console.error(err);
  }
}

window.onload = () => {
  init();
  document.getElementById("connectBtn").onclick = connect;
};
