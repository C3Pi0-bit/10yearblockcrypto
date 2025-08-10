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
    cacheProvider: true,  // Вмикаємо кешування для автоматичного відновлення
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

    // Сховати мобільне повідомлення при успішному підключенні
    document.getElementById("mobileNotice").style.display = "none";

    provider = new ethers.providers.Web3Provider(externalProvider);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, abi, signer);

    const userAddress = await signer.getAddress();
    alert("Wallet connected: " + shortAddress(userAddress));
    document.getElementById("walletAddress").innerText = userAddress;

    updateBalance();
    updateTopDonors();

    // Підписка на відключення гаманця
    externalProvider.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        document.getElementById("walletAddress").innerText = accounts[0];
      }
    });

    externalProvider.on("disconnect", () => {
      disconnect();
    });

  } catch (err) {
    if (err.message.includes("User closed modal")) {
      // Якщо користувач закрив вікно підключення, показати повідомлення на мобільних
      if (/Mobi|Android/i.test(navigator.userAgent)) {
        document.getElementById("mobileNotice").style.display = "block";
      }
    } else {
      alert("Connection failed: " + err.message);
      console.error(err);
    }
  }
}

function disconnect() {
  document.getElementById("walletAddress").innerText = "";
  web3Modal.clearCachedProvider();
  provider = null;
  signer = null;
  contract = null;
}

async function updateBalance() {
  if (!contract) return;
  try {
    const balanceWei = await contract.getBalance();
    const balanceEth = ethers.utils.formatEther(balanceWei);
    document.getElementById("balance").innerText = parseFloat(balanceEth).toFixed(4);
  } catch (e) {
    console.error("Failed to get balance:", e);
  }
}

async function updateTopDonors() {
  if (!contract) return;
  try {
    const topDonors = await contract.getTopDonors();
    const list = document.getElementById("topDonorsList");
    list.innerHTML = "";
    topDonors.forEach((address, index) => {
      if (address === "0x0000000000000000000000000000000000000000") {
        list.innerHTML += `<li>No donor ${index + 1}</li>`;
      } else {
        list.innerHTML += `<li>${shortAddress(address)}</li>`;
      }
    });
  } catch (e) {
    console.error("Failed to get top donors:", e);
  }
}

async function donate() {
  if (!contract || !signer) {
    alert("Please connect your wallet first.");
    return;
  }
  const amountInput = document.getElementById("donateAmount");
  let amountEth = amountInput.value;
  if (!amountEth || isNaN(amountEth) || Number(amountEth) <= 0) {
    alert("Please enter a valid amount of ETH.");
    return;
  }
  try {
    const tx = await signer.sendTransaction({
      to: contractAddress,
      value: ethers.utils.parseEther(amountEth)
    });
    alert("Donation sent! Transaction hash: " + tx.hash);
    amountInput.value = "";
    await tx.wait();
    updateBalance();
    updateTopDonors();
  } catch (e) {
    alert("Donation failed: " + e.message);
    console.error(e);
  }
}

async function release() {
  if (!contract || !signer) {
    alert("Please connect your wallet first.");
    return;
  }
  try {
    const tx = await contract.release();
    alert("Unlock transaction sent! Tx hash: " + tx.hash);
    await tx.wait();
    updateBalance();
  } catch (e) {
    alert("Unlock failed: " + e.message);
    console.error(e);
  }
}

// Таймер до розблокування (приклад: 10 років від 4 серпня 2025)
function updateCountdown() {
  const unlockDate = new Date("2025-08-04T00:00:00Z").getTime();
  const now = new Date().getTime();
  const diff = unlockDate - now;

  if (diff <= 0) {
    document.getElementById("countdown").innerText = "Funds are unlocked!";
    return;
  }

  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("countdown").innerText =
    `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

window.onload = async () => {
  init();

  if (web3Modal.cachedProvider) {
    try {
      await connect();
    } catch (e) {
      console.warn("Auto reconnect failed", e);
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  document.getElementById("connectBtn").onclick = connect;
  document.getElementById("donateBtn").onclick = donate;
  document.getElementById("releaseBtn").onclick = release;
};
