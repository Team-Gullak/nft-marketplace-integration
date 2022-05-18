import { useState, useEffect } from 'react'
// 645b2c8c-5825-4930-baf3-d9b997fcd88c
import { ethers } from 'ethers'

const Socket = () => {
    const [values, setValues] = useState({ fromChainId: "137", toChainId: "1", fromToken: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', toToken: '0xdac17f958d2ee523a2206206994597c13d831ec7', amount: '1000' });
    const API_KEY = '645b2c8c-5825-4930-baf3-d9b997fcd88c';
    // const userAddress = '0xd232979ed3fc90a331956C4e541815b478116a7D';
    const [userAddress, setuserAddress] = useState('')
    const [bestRoute, setBestRoute] = useState({})

    const connectToMetamask = async () => {

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

        setuserAddress(accounts[0])
        console.log('User Address', accounts[0]);
    }

    const getSigner = async () => {

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log(signer)
        return signer;
    }

    const fetchFromTokens = async () => {

        try {

            const options = { method: 'GET', headers: { 'API-KEY': API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json', } };

            const res = await fetch(`https://backend.movr.network/v2/token-lists/from-token-list?fromChainId=${values.fromChainId}&toChainId=${values.toChainId}`, options)
            const data = await res.json();
            console.log('Fetch from tokens', data);

        } catch (error) {
            console.error(error);
        }
    }

    const fetchToTokens = async () => {

        try {

            const options = { method: 'GET', headers: { 'API-KEY': API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json', } };

            const res = await fetch(`https://backend.movr.network/v2/token-lists/to-token-list?fromChainId=${values.fromChainId}&toChainId=${values.toChainId}`, options)

            const data = await res.json();
            console.log('Fetch To Tokens', data);

        } catch (error) {
            console.error(error);
        }
    }


    const getQuote = async () => {

        try {

            const options = {
                method: 'GET', headers: {
                    'API-KEY': '645b2c8c-5825-4930-baf3-d9b997fcd88c', 'Accept': 'application/json', 'Content-Type': 'application/json'
                }
            };

            const res = await fetch(`https://backend.movr.network/v2/quote?fromChainId=${values.fromChainId}&fromTokenAddress=${values.fromToken}&toChainId=${values.toChainId}&toTokenAddress=${values.toToken}&fromAmount=${values.amount}&userAddress=${userAddress}&uniqueRoutesPerBridge=true&sort=gas&singleTxOnly=true`, options)

            const data = await res.json();
            setBestRoute(data.result.routes[0])
            console.log('QUOTE', data);
            if (quote.result.routes[0] == undefined) throw new Error("No routes found");
            console.log('Best Route', data.result.routes[0]);

            return data.result.routes[0];

        } catch (error) {
            console.error(error);
        }
    }

    // Makes a POST request to Socket APIs for transaction data
    const buildTx = async () => {
        const route = await getQuote();
        try {
            const options = { method: 'POST', headers: { 'API-KEY': '645b2c8c-5825-4930-baf3-d9b997fcd88c', 'Accept': 'application/json', 'Content-Type': 'application/json', }, body: JSON.stringify({ "route": route }) };

            const response = await fetch('https://backend.movr.network/v2/build-tx', options)

            const json = await response.json();
            console.log(json);

        } catch (error) {
            console.error(error);
        }


    }

    const transaction = async () => {
        const signer = await getSigner();

        // Quote for bridging 100 USDC on Polygon to USDT on BSC 
        // For single transaction bridging, mark singleTxOnly flag as true in query params
        const route = await getQuote();

        // Fetching transaction data for swap/bridge tx
        let apiReturnData = await buildTx(route);

        console.log(apiReturnData);

        const tx = await signer.sendTransaction({
            to: apiReturnData.result.txTarget,
            data: apiReturnData.result.txData
        });

        // Initiates transaction on user's frontend which user has to sign
        const receipt = await tx.wait();

        console.log(receipt);
    }


    useEffect(() => {
        connectToMetamask();
    }, [])


    return (
        <div style={{ margin: '10px' }}>
            {!userAddress && <button onClick={connectToMetamask}>Connect to Metamask</button>}
            {userAddress && <div>
                <p>User Address : {userAddress}</p>
                <form >
                    <div>
                        <input
                            style={{ width: '240px', padding: '10px', margin: '10px' }}
                            placeholder="Chain id of from"
                            onChange={(e) =>
                                setValues({ ...values, fromChainId: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <input
                            style={{ width: '500px', padding: '10px', margin: '10px' }}
                            placeholder="From Token Address"
                            onChange={(e) =>
                                setValues({ ...values, fromToken: e.target.value })
                            }
                        />
                    </div>
                    <div >
                        <input
                            style={{ width: '500px', padding: '10px', margin: '10px' }}
                            placeholder="Amount"
                            onChange={(e) =>
                                setValues({ ...values, amount: e.target.value })
                            }
                        />
                    </div>
                </form>

                <button onClick={fetchFromTokens}>Fetch From Token List</button>
                <button onClick={fetchToTokens}>Fetch To Token List</button>
                <button onClick={getQuote}>Fetch Best routes to bridge</button>
                <button onClick={buildTx}>Build Transaction to bridge</button>
                <button onClick={transaction}>Transact</button>

            </div>}
        </div>
    )
}

export default Socket