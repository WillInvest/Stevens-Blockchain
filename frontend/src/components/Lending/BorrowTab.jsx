import { useState, useEffect } from "react";
import BorrowForm from "./BorrowForm";
import MyBorrows from "./MyBorrows";
import { stevensRed, stevensTextGrey } from "../../styles/constants";

export default function BorrowTab({ wallet, duckCoinContract, nftContract }) {
  const [porBalance, setPorBalance] = useState("0");
  const [dcBalance, setDcBalance] = useState("0");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!wallet || !nftContract || !duckCoinContract) return;

      try {
        // TODO: Fetch from contracts
        // const por = await nftContract.balanceOf(wallet);
        // const dc = await duckCoinContract.balanceOf(wallet);
        // setPorBalance(por.toString());
        // setDcBalance(dc.toString());

        // Mock data
        setPorBalance("300");
        setDcBalance("200");
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    fetchBalances();
  }, [wallet, nftContract, duckCoinContract, refreshTrigger]);

  const handleBorrowCreated = () => {
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
          Please connect your wallet to borrow SBC
        </div>
      ) : (
        <>
          {/* Borrow Form */}
          <BorrowForm
            wallet={wallet}
            porBalance={porBalance}
            dcBalance={dcBalance}
            duckCoinContract={duckCoinContract}
            nftContract={nftContract}
            onBorrowCreated={handleBorrowCreated}
          />

          {/* My Borrows */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{
              marginBottom: 16,
              color: stevensRed,
              fontSize: 18,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              My Active Borrows
            </h3>
            <MyBorrows
              wallet={wallet}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </>
      )}
    </div>
  );
}


