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
        infuraId: "499eccaaa1c34321be3edd18295da9fa" // <- встав свій Infura Project ID сюди
      }
    }
  };

  web3Modal = new window.Web3Modal.default({
    cacheProvider: true,
    providerOptions
  });

  // Показуємо повідомлення для мобільних
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    document.getElementById("mobileNotice").style.display = "block";
  }
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
    document.getElementById("walletAddress").innerText = userAddress;

    await updateBalance();
    await updateTopDonors();

    alert("Wallet connected: " + shortAddress(userAddress));
  } catch (err) {
    alert("Connection failed: " + err.message);
    console.error(err);
  }
}

async function autoConnect() {
  if (web3Modal.cachedProvider) {
    try {
      await connect();
    } catch (e) {
      console.log("Auto connect failed:", e);
    }
  }
}

async function donate() {
  if (!signer) {
    alert("Please connect your wallet first.");
    return;
  }
  const amount = document.getElementById("donateAmount").value;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    alert("Enter a valid ETH amount");
    return;
  }
  try {
    const tx = await signer.sendTransaction({
      to: contractAddress,
      value: ethers.utils.parseEther(amount)
    });
    await tx.wait();
    alert("Donation successful!");
    await updateBalance();
    await updateTopDonors();
  } catch (err) {
    alert("Error: " + err.message);
    console.error(err);
  }
}

async function release() {
  if (!contract) {
    alert("Please connect your wallet first.");
    return;
  }
  try {
    const tx = await contract.release();
    await tx.wait();
    alert("Funds released!");
    await updateBalance();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function updateBalance() {
  try {
    const balance = await contract.getBalance();
    const eth = ethers.utils.formatEther(balance);
    document.getElementById("balance").innerText = parseFloat(eth).toFixed(4);
  } catch (err) {
    document.getElementById("balance").innerText = "---";
  }
}

async function updateTopDonors() {
  try {
    const [d1, d2, d3] = await contract.getTopDonors();
    const list = document.getElementById("topDonorsList");
    list.innerHTML = "";
    list.innerHTML += `<li>🥇 ${shortAddress(d1)}</li>`;
    list.innerHTML += `<li>🥈 ${shortAddress(d2)}</li>`;
    list.innerHTML += `<li>🥉 ${shortAddress(d3)}</li>`;
  } catch (err) {
    console.error("Top donors error:", err);
    document.getElementById("topDonorsList").innerHTML = "<li>Failed to load top donors</li>";
  }
}

const unlockTimestamp = Math.floor(new Date("2035-08-04T00:00:00Z").getTime() / 1000);
function updateCountdown() {
  const now = Math.floor(Date.now() / 1000);
  let secondsLeft = unlockTimestamp - now;

  if (secondsLeft < 0) {
    document.getElementById("countdown").innerText = "Unlocked!";
    return;
  }

  const days = Math.floor(secondsLeft / (3600 * 24));
  secondsLeft %= 3600 * 24;
  const hours = Math.floor(secondsLeft / 3600);
  secondsLeft %= 3600;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  document.getElementById("countdown").innerText =
    `${days} days ${hours}h ${minutes}m ${seconds}s`;
}

window.onload = () => {
  init();

  document.getElementById("connectBtn").onclick = connect;
  document.getElementById("donateBtn").onclick = donate;
  document.getElementById("releaseBtn").onclick = release;

  updateCountdown();
  setInterval(updateCountdown, 1000);

  autoConnect();

  window.addEventListener("focus", async () => {
    if (web3Modal && !signer) {
      try {
        await connect();
      } catch {}
    }
  });
};
