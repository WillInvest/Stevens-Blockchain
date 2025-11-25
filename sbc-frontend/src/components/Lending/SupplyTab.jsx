import { useState, useEffect } from "react";
import SupplyForm from "./SupplyForm";
import MySupplies from "./MySupplies";
import { stevensRed, stevensTextGrey } from "../../styles/constants";

export default function SupplyTab({ wallet, duckCoinContract, nftContract }) {
  const [dcBalance, setDcBalance] = useState("0");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!wallet || !duckCoinContract) return;

      try {
        // TODO: Fetch from contracts
        // const dc = await duckCoinContract.balanceOf(wallet);
        // setDcBalance(dc.toString());

        // Mock data
        setDcBalance("1000");
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    fetchBalances();
  }, [wallet, duckCoinContract, refreshTrigger]);

  const handleSupplyCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div>
      {!wallet ? (
        <div style={{
          padding: 40,
          textAlign: "center",
          color: stevensTextGrey
        }}>
          Please connect your wallet to lend Duck Coin
        </div>
      ) : (
        <>
          {/* Supply Form */}
          <SupplyForm
            wallet={wallet}
            dcBalance={dcBalance}
            duckCoinContract={duckCoinContract}
            onSupplyCreated={handleSupplyCreated}
          />

          {/* My Supplies */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{
              marginBottom: 16,
              color: stevensRed,
              fontSize: 18,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              My Active Supplies
            </h3>
            <MySupplies
              wallet={wallet}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </>
      )}
    </div>
  );
}

