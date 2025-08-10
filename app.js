const ethereumAddressToReceive = "ТВОЯ_АДРЕСА_ТУТ_0x..."; // Замінити на твою адресу ETH

let provider;
let signer;
let walletAddress;

const connectBtn = document.getElementById("connectBtn");
const walletInfo = document.getElementById("walletInfo");
const walletAddressSpan = document.getElementById("walletAddress");
const donateAmountInput = document.getElementById("donateAmount");
const sendBtn = document.getElementById("sendBtn");
const statusP = document.getElementById("status");

async function connectMetaMask() {
  if (!window.ethereum) {
    alert("MetaMask не встановлено! Будь ласка, встанови MetaMask.");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    walletAddress = await signer.getAddress();

    onWalletConnected();
  } catch (error) {
    alert("Підключення через MetaMask скасовано або сталася помилка.");
    console.error(error);
  }
}

async function connectWalletConnect() {
  // Ініціалізація провайдера WalletConnect
  const WalletConnectProvider = window.WalletConnectProvider.default;
  const wcProvider = new WalletConnectProvider({
    rpc: {
      1: "https://mainnet.infura.io/v3/your_infura_project_id" // Заміни, якщо треба
    },
  });

  try {
    await wcProvider.enable();
    provider = new ethers.providers.Web3Provider(wcProvider);
    signer = provider.getSigner();
    walletAddress = await signer.getAddress();

    // Підписка на роз’єднання
    wcProvider.on("disconnect", (code, reason) => {
      resetUI();
    });

    onWalletConnected();
  } catch (error) {
    alert("Підключення через WalletConnect скасовано або сталася помилка.");
    console.error(error);
  }
}

function resetUI() {
  walletInfo.classList.add("hidden");
  connectBtn.disabled = false;
  connectBtn.textContent = "Підключити гаманець";
  walletAddressSpan.textContent = "";
  donateAmountInput.value = "";
  statusP.textContent = "";
  provider = null;
  signer = null;
  walletAddress = null;
}

function onWalletConnected() {
  connectBtn.disabled = true;
  connectBtn.textContent = "Гаманець підключено";
  walletInfo.classList.remove("hidden");
  walletAddressSpan.textContent = walletAddress;
  statusP.textContent = "";
}

async function sendDonation() {
  statusP.textContent = "";

  if (!signer) {
    alert("Будь ласка, спочатку підключи гаманець.");
    return;
  }

  let amountEth = donateAmountInput.value;
  if (!amountEth || isNaN(amountEth) || Number(amountEth) <= 0) {
    alert("Введи коректну суму для донату.");
    return;
  }

  try {
    sendBtn.disabled = true;
    statusP.textContent = "Очікування підтвердження транзакції...";

    const tx = await signer.sendTransaction({
      to: ethereumAddressToReceive,
      value: ethers.utils.parseEther(amountEth.toString())
    });

    statusP.textContent = `Транзакція відправлена. Хеш: ${tx.hash}`;
    await tx.wait();

    statusP.textContent = "Донат успішно надіслано. Дякую!";
  } catch (error) {
    console.error(error);
    statusP.textContent = "Помилка при відправці транзакції.";
  } finally {
    sendBtn.disabled = false;
  }
}

// При кліку на кнопку "Підключити гаманець" показати вибір
connectBtn.addEventListener("click", async () => {
  const choice = prompt("Оберіть спосіб підключення:
1 - MetaMask (браузер)
2 - WalletConnect (мобільний)");

  if (choice === "1") {
    await connectMetaMask();
  } else if (choice === "2") {
    await connectWalletConnect();
  } else {
    alert("Вибір не розпізнано.");
  }
});

sendBtn.addEventListener("click", sendDonation);
