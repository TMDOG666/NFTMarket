"use client";

import type { NextPage } from "next";
import { useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";
import { useEffect, useState } from "react";
import { NFTFrame } from "~~/components/myframe/Frame"

export function weiToEther(weiValue: string): string {
    const weiBigInt = BigInt(weiValue);
    const etherBigInt = weiBigInt / BigInt(10 ** 18);
    const remainder = weiBigInt % BigInt(10 ** 18);
    const etherFraction = remainder.toString().padStart(18, '0').slice(0, 18);

    let result = `${etherBigInt}`;
    if (etherFraction !== '000000000000000000') {
        result += `.${etherFraction.replace(/0+$/, '')}`;
    }

    return result;
}

const AdminManagement: NextPage = () => {
    const { writeContractAsync: yourCollectiblewriteContractAsync } = useScaffoldWriteContract("YourCollectible");
    const { data: yourCollectible, isLoading: yourCollectibleIsLoading } = useScaffoldContract({ contractName: "YourCollectible" });
    const { writeContractAsync: yourCollectibleAuctionwriteContractAsync } = useScaffoldWriteContract("YourCollectibleAuction");
    const { data: yourCollectibleAuction, isLoading: yourCollectibleAuctionIsLoading } = useScaffoldContract({ contractName: "YourCollectibleAuction" });

    const { address: connectedAddress } = useAccount();
    const [yourCollectiblecontractBalance, setYourCollectibleContractBalance] = useState<string>("0");
    const [yourCollectibleAuctioncontractBalance, setYourCollectibleAuctionContractBalance] = useState<string>("0");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        handleFetchYourCollectibleBalance();
    }, [yourCollectibleIsLoading, yourCollectibleAuctionIsLoading]);

    const handleFetchYourCollectibleBalance = async () => {
        if (!yourCollectible || !yourCollectibleAuction) return;
        setIsLoading(true);
        try {
            const balance = await yourCollectible.read.getContractBalance();
            setYourCollectibleContractBalance(balance.toString());
            const auctionBalance = await yourCollectibleAuction.read.getContractBalance();
            setYourCollectibleAuctionContractBalance(auctionBalance.toString());
        } catch (error) {
            console.error("Error fetching balance:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (yourCollectiblecontractBalance === "0" && yourCollectibleAuctioncontractBalance === "0") {
            notification.error("合约余额为0，无需提现");
            return;
        }
        if (!yourCollectiblewriteContractAsync) return;
        setIsLoading(true);
        try {
            await yourCollectiblewriteContractAsync({
                functionName: "withdraw",
            });
            await yourCollectibleAuctionwriteContractAsync({
                functionName: "withdraw",
            });
            alert("提现成功！");
            setYourCollectibleContractBalance("0");
            setYourCollectibleAuctionContractBalance("0");
        } catch (error) {
            console.error("Error withdrawing balance:", error);
            alert("提现失败，请重试！");
        } finally {
            setIsLoading(false);
        }
    };

    if (yourCollectibleIsLoading && yourCollectibleAuctionIsLoading)
        return (
            <div className="flex justify-center items-center mt-10">
                <span className="loading loading-spinner loading-xl"></span>
            </div>
        );

    return (
        <div className="flex items-center flex-col flex-grow pt-10">
            <div className="px-5">
                <h1 className="text-center mb-8">
                    <span className="block text-5xl font-bold">管理员后台</span>
                </h1>
                <div className="card w-full max-w-lg bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h1 className="card-title text-center text-xl font-semibold">合约余额管理</h1>
                        <h1 className="text-center mb-8">
                            <span className="block text-2xl font-bold">YourCollectible</span>
                            <p className="text-center text-l font-semibold">
                                当前合约余额: <span className="text-orange-600">{weiToEther(yourCollectiblecontractBalance)} ETH</span>
                            </p>
                        </h1>
                        <h1 className="text-center mb-8">
                            <span className="block text-2xl font-bold">YourCollectibleAuction</span>
                            <p className="text-center text-l font-semibold">
                                当前合约余额: <span className="text-orange-600">{weiToEther(yourCollectibleAuctioncontractBalance)} ETH</span>
                            </p>
                        </h1>
                        <div className="py-4">
                            <button
                                className={`btn btn-secondary w-full py-3 text-xl`}
                                onClick={handleWithdraw}
                                disabled={yourCollectibleIsLoading && yourCollectibleAuctionIsLoading}
                            >
                                提现合约余额
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminManagement;
