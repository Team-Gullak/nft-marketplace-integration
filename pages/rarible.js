import { createRaribleSdk } from "@rarible/sdk"
import { useState } from 'react'
import Web3 from "web3"
import { toItemId, toUnionAddress } from "@rarible/types"
import * as HDWalletProvider from "@truffle/hdwallet-provider"
import { Web3Ethereum } from "@rarible/web3-ethereum"
// import { EthersEthereum, EthersWeb3ProviderEthereum } from "@rarible/ethers-ethereum"
import { EthereumWallet } from "@rarible/sdk-wallet"

// "@rarible/web3-ethereum": "^0.12.67",

const getSdk = async () => {

    const provider = new HDWalletProvider({
        providerOrUrl: `https://speedy-nodes-nyc.moralis.io/${process.env.NEXT_PUBLIC_URL}/eth/rinkeby`,
        privateKeys: [`${process.env.NEXT_PUBLIC_PRIVATE}`],
        chainId: 4,
    })

    const web3 = new Web3(provider);
    const web3Ethereum = new Web3Ethereum({ web3 })
    const ethWallet = new EthereumWallet(web3Ethereum)

    const raribleSdk = createRaribleSdk(ethWallet, "staging")

    return raribleSdk;
}


const Rarible = () => {
    const [values, setValues] = useState({ tokenAddress: "", tokenId: "" });
    const [orders, setOrders] = useState([])

    const blockchain = 'ETHEREUM'
    const ITEM_ID = `${blockchain}:${values.tokenAddress}:${values.tokenId}`;
    const ethCurrency = {
        "@type": "ERC20",
        contract: `${blockchain}:0xc778417E063141139Fce010982780140Aa0cD5Ab`, //on Rinkeby
    };

    const sell = async () => {

        try {
            const raribleSdk = await getSdk();

            const sellResponse = await raribleSdk.order.sell({
                itemId: toItemId(ITEM_ID),

            });

            const sellOrderId = await sellResponse.submit({
                amount: 1,
                price: "0.0002",
                currency: {
                    '@type': "ETH",
                    blockchain: "ETHEREUM"
                },
                // expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days

            })
            console.log(sellOrderId)


            const orders = await raribleSdk.apis.order.getOrderById({
                itemId: toItemId(sellOrderId),
            })

            console.log('Orders', orders);

        } catch (error) {
            console.error(error)
        }

    }

    const buy = async () => {
        try {
            const raribleSdk = await getSdk();

            console.log('Buying started')

            const sellOrders = await raribleSdk.apis.order.getSellOrdersByItem({
                itemId: toItemId(ITEM_ID),
                status: 'ACTIVE',
            })
            console.log('Sellorders', sellOrders.orders[0].id);
            const id = sellOrders.orders[0].id;


            const buyAction = await raribleSdk.order.buy({ orderId: id })

            const buyOrderId = await buyAction.submit({
                amount: 1,
            })
            console.log('Buying successfull', buyOrderId)


        } catch (error) {
            console.error(error)
        }
    }

    const bid = async () => {
        try {
            const raribleSdk = await getSdk();

            const bidAction = await raribleSdk.order.bid({
                itemId: toItemId(ITEM_ID),
            })
            const bidOrderId = await bidAction.submit({
                amount: 1,
                price: "0.0002",
                currency: {
                    '@type': "ERC20",
                    contract: "ETHEREUM:0xc778417E063141139Fce010982780140Aa0cD5Ab" // WETH contract address
                },
            })
            console.log('Bidorder ID:', bidOrderId)

            const auctionBids = await raribleSdk.apis.order.getAuctionBidsById({
                itemId: toItemId(ITEM_ID),
            })

            console.log('AuctionBids', auctionBids);

        } catch (error) {
            console.error(error)
        }

    }

    const getAsset = async () => {
        const raribleSdk = await getSdk();

        try {
            const token = await raribleSdk.apis.item.getItemById({
                itemId: toItemId(ITEM_ID),
            })

            console.log(token)
            console.log('Best sell order', token?.bestSellOrder)
            console.log('Best Bid order', token?.bestBidOrder)

        } catch (error) {
            console.error(error)
        }
    };


    return (
        <div>
            <form >
                <div>
                    <input
                        style={{ width: '500px', padding: '10px', margin: '10px' }}
                        placeholder="NFT Token Address"
                        onChange={(e) =>
                            setValues({ ...values, tokenAddress: e.target.value })
                        }
                    />
                </div>
                <div >
                    <input
                        style={{ width: '500px', padding: '10px', margin: '10px' }}
                        placeholder="NFT Token ID"
                        onChange={(e) =>
                            setValues({ ...values, tokenId: e.target.value })
                        }
                    />


                </div>
            </form>
            <div style={{ display: 'flex', margin: '10px', }}>
                <button onClick={getAsset}>Get Asset</button>

                <>
                    <button onClick={buy}>Buy the nft</button>
                    <button onClick={sell}>Sell the nft</button>
                    <button onClick={bid}>Bid the nft</button>
                </>

            </div>
        </div>
    )
}

export default Rarible