import { useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import { SBC_ABI } from "../contracts/abi";
import { SBC_ADDRESS } from "../contracts/config";

export function useContract() {
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState(null);

  const connectWallet = async () => {
    const provider = await detectEthereumProvider();
    if (!provider) return alert("MetaMask not found!");

    await provider.request({ method: "eth_requestAccounts" });
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();

    setWallet(await signer.getAddress());
    setContract(new ethers.Contract(SBC_ADDRESS, SBC_ABI, signer));
  };

  return { wallet, contract, connectWallet };
}


