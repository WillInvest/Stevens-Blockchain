import { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import { SBC_ABI } from "../contracts/abi";
import { 
  SBC_ADDRESS, 
  SDC_ADDRESS,
  SRPC_ADDRESS,
  STUDENT_MANAGEMENT_ADDRESS, 
  DUCK_COIN_ADDRESS, 
  PROVE_OF_REPUTATION_ADDRESS 
} from "../contracts/config";
// Import ABIs - these will be parsed JSON arrays
import studentManagementAbiData from "../contracts/studentManagementAbi.json";
import duckCoinAbiData from "../contracts/duckCoinAbi.json";
import proveOfReputationAbiData from "../contracts/proveOfReputationAbi.json";

// Parse the JSON strings if they're strings, otherwise use as-is
const studentManagementAbi = typeof studentManagementAbiData === 'string' 
  ? JSON.parse(studentManagementAbiData) 
  : studentManagementAbiData;

const duckCoinAbi = typeof duckCoinAbiData === 'string' 
  ? JSON.parse(duckCoinAbiData) 
  : duckCoinAbiData;

const proveOfReputationAbi = typeof proveOfReputationAbiData === 'string' 
  ? JSON.parse(proveOfReputationAbiData) 
  : proveOfReputationAbiData;

export function useContract() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState(null); // Old SBC contract (for backward compatibility)
  const [studentManagementContract, setStudentManagementContract] = useState(null);
  const [duckCoinContract, setDuckCoinContract] = useState(null); // SBC (Stevens Banana Coin)
  const [nftContract, setNftContract] = useState(null); // SRPC (Stevens Reputation Proof Coin)
  const [sdcContract, setSdcContract] = useState(null); // SDC (Stevens Duck Coin)

  const connectWallet = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) return alert("MetaMask not found!");

    await provider.request({ method: "eth_requestAccounts" });
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();

    const address = await signer.getAddress();
    setWallet(address);

    // Load old SBC contract (for backward compatibility)
    const oldContract = new ethers.Contract(SBC_ADDRESS, SBC_ABI, signer);
    setContract(oldContract);

    // Load new contracts if addresses are set (and not empty strings)
    if (STUDENT_MANAGEMENT_ADDRESS && STUDENT_MANAGEMENT_ADDRESS.trim() !== "") {
      const studentMgmt = new ethers.Contract(STUDENT_MANAGEMENT_ADDRESS, studentManagementAbi, signer);
      setStudentManagementContract(studentMgmt);
    }

    if (DUCK_COIN_ADDRESS && DUCK_COIN_ADDRESS.trim() !== "") {
      const duckCoin = new ethers.Contract(DUCK_COIN_ADDRESS, duckCoinAbi, signer);
      setDuckCoinContract(duckCoin);
    }

    if (PROVE_OF_REPUTATION_ADDRESS && PROVE_OF_REPUTATION_ADDRESS.trim() !== "") {
      const nft = new ethers.Contract(PROVE_OF_REPUTATION_ADDRESS, proveOfReputationAbi, signer);
      setNftContract(nft);
    }

    // Load SDC contract (Stevens Duck Coin)
    if (SDC_ADDRESS && SDC_ADDRESS.trim() !== "") {
      const sdc = new ethers.Contract(SDC_ADDRESS, duckCoinAbi, signer); // Use same ERC20 ABI
      setSdcContract(sdc);
    }
  };

  return { 
    wallet, 
    contract, // Old SBC contract
    studentManagementContract, // New StudentManagement contract
    duckCoinContract, // SBC (Stevens Banana Coin) - legacy name
    nftContract, // SRPC (Stevens Reputation Proof Coin) - legacy name
    sdcContract, // SDC (Stevens Duck Coin)
    connectWallet 
  };
}




