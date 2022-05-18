import { useState, useEffect } from 'react'
// 645b2c8c-5825-4930-baf3-d9b997fcd88c
import { ethers } from 'ethers'
const ERC20_ABI = require('../ERC_20.json')

const SocketMulti = () => {
    const [values, setValues] = useState({ fromChainId: "137", toChainId: "1", fromToken: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', toToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', amount: '100' });
    const API_KEY = '645b2c8c-5825-4930-baf3-d9b997fcd88c';
    // const userAddress = '0xd232979ed3fc90a331956C4e541815b478116a7D';
    const [userAddress, setuserAddress] = useState('')
    const [bestRoute, setBestRoute] = useState({})

    const connectToMetamask = async () => {

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })

        setuserAddress(accounts[0])
        console.log('User Address', accounts[0]);
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

            const res = await fetch(`https://backend.movr.network/v2/quote?fromChainId=${values.fromChainId}&fromTokenAddress=${values.fromToken}&toChainId=${values.toChainId}&toTokenAddress=${values.toToken}&fromAmount=${values.amount}&userAddress=${userAddress}&uniqueRoutesPerBridge=true&sort=gas`, options)

            const data = await res.json();
            console.log('Quote:', data)
            return data;

        } catch (error) {
            console.error(error);
        }
    }

    // Starts bridging journey, creating a unique 'routeId' 
    async function startRoute(startRouteBody) {

        try {
            const response = await fetch('https://backend.movr.network/v2/route/start', {
                method: 'POST',
                headers: {
                    'API-KEY': API_KEY,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: startRouteBody
            });

            const json = await response.json();
            return json;
        }
        catch (error) {
            console.log("Error", error);
        }
    }

    // Sends confirmation of completion of transaction & gets status of whether to proceed with next transaction
    async function prepareNextTx(activeRouteId, userTxIndex, txHash) {
        try {
            const response = await fetch(`https://backend.movr.network/v2/route/prepare?activeRouteId=${activeRouteId}&userTxIndex=${userTxIndex}&txHash=${txHash}`, {
                method: 'GET',
                headers: {
                    'API-KEY': API_KEY,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const json = await response.json();
            return json;
        }
        catch (error) {
            console.log("Error", error);
        }
    }

    // Calls route/build-next-tx and receives transaction data in response 
    async function buildNextTx(activeRouteId) {
        try {
            const response = await fetch(`https://backend.movr.network/v2/route/build-next-tx?activeRouteId=${activeRouteId}`, {
                method: 'GET',
                headers: {
                    'API-KEY': API_KEY,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const json = await response.json();
            return json;
        }
        catch (error) {
            console.log("Error", error);
        }
    }

    // Helper Function to make approval
    async function makeApprovalTx(approvalTokenAddress, allowanceTarget, minimumApprovalAmount, signer) {
        const ERC20Contract = new ethers.Contract(approvalTokenAddress, ERC20_ABI, signer);
        console.log('ERC20Contract', ERC20Contract);
        const gasEstimate = await ERC20Contract.estimateGas.approve(allowanceTarget, minimumApprovalAmount);
        const gasPrice = await signer.getGasPrice();

        console.log('Gas: ', ethers.utils.formatUnits(gasPrice, "ether"));

        return ERC20Contract.approve(allowanceTarget, minimumApprovalAmount, {
            gasLimit: gasEstimate,
            gasPrice: gasPrice
        });
    }




    // Main function 
    const transaction = async () => {

        const fromProvider = new ethers.providers.Web3Provider(window.ethereum);
        const fromSigner = fromProvider.getSigner();

        const toProvider = new ethers.providers.EtherscanProvider(
            'rinkeby',
            `${process.env.NEXT_PUBLIC_API}`
        )
        const toSigner = new ethers.Wallet(`${process.env.NEXT_PUBLIC_PRIVATE}`, toProvider);


        const uniqueRoutesPerBridge = true; // Returns the best route for a given DEX / bridge combination
        const sort = "gas"; // "output" | "gas" | "time"
        let activeRouteId; // These are retrieved and assinged from /route/start
        let userTxIndex; // These are retrieved and assinged from /route/start
        let txTarget;
        let txData;
        let value;


        const res = await getQuote();

        if (res.result.routes[0] === undefined) {
            console.error('No route found')
            return;
        }
        const route = res.result.routes[0];
        console.log('Route : ', route);

        // Body to be sent in the /route/start request
        let startRouteBody = {
            "fromChainId": values.fromChainId,
            "toChainId": values.toChainId,
            "fromAssetAddress": values.fromToken,
            "toAssetAddress": values.toToken,
            "includeFirstTxDetails": true,
            "route": route
        }

        console.log("Starting Route", startRouteBody, JSON.stringify(startRouteBody));

        const routeStarted = await startRoute(JSON.stringify(startRouteBody));

        // Relevant data from response of /route/start
        activeRouteId = routeStarted.result.activeRouteId;
        userTxIndex = routeStarted.result.userTxIndex;
        activeRouteId = routeStarted.result.activeRouteId;
        userTxIndex = routeStarted.result.userTxIndex;
        txTarget = routeStarted.result.txTarget;
        txData = routeStarted.result.txData;
        value = routeStarted.result.value;

        console.log({ activeRouteId, userTxIndex });

        // Checks if user needs to give Socket contracts approval
        if (routeStarted.result.approvalData != null) {
            console.log('Approval is needed', routeStarted.result.approvalData);

            // Params for approval
            let approvalTokenAddress = routeStarted.result.approvalData.approvalTokenAddress;
            let allowanceTarget = routeStarted.result.approvalData.allowanceTarget;
            let minimumApprovalAmount = routeStarted.result.approvalData.minimumApprovalAmount;

            let tx = await makeApprovalTx(approvalTokenAddress, allowanceTarget, minimumApprovalAmount, fromSigner);
            console.log('tx for approval', tx);
            await tx.wait().then(receipt => console.log('Approval Tx :', receipt.transactionHash))
                .catch(e => console.log(e));
        }
        else {
            console.log('Approval not needed');
        }

        // Main Socket Transaction (Swap + Bridge in one tx)
        const gasPrice = await fromSigner.getGasPrice();
        const sourceGasEstimate = await fromProvider.estimateGas({
            from: fromSigner.address,
            to: txTarget,
            value: value,
            data: txData,
            gasPrice: gasPrice
        });

        const tx = await fromSigner.sendTransaction({
            from: fromSigner.address,
            to: txTarget,
            data: txData,
            value: value,
            gasPrice: gasPrice,
            gasLimit: sourceGasEstimate
        });

        const receipt = await tx.wait();
        const txHash = receipt.transactionHash;
        console.log('Socket source Brige Tx :', receipt.transactionHash);

        let isInitiated = false;

        // Repeatedly pings /route/prepare with executed transaction hash
        // Once the bridging process is complete, if it returns 'completed', the setInterval exits
        // If another swap transaction is involved post bridging, the returned response result is 'ready'
        // In which case the above process is repeated on destination chain
        const status = setInterval(async () => {
            // Gets status of route journey 
            const status = await prepareNextTx(activeRouteId, userTxIndex, txHash);
            console.log("Current status :", status.result);

            // Exits setInterval if route is 'completed'
            if (status.result == 'completed') {
                console.log('Bridging transaction is complete');
                clearInterval(status);
            }

            // Executes post bridging transactions on destination
            else if (status.result == 'ready') {
                if (!isInitiated) {
                    isInitiated = true;
                    console.log('Proceeding with post-bridging transaction');

                    const nextTx = await buildNextTx(activeRouteId);
                    console.log(nextTx);

                    // Updates relevant params
                    userTxIndex = nextTx.result.userTxIndex;
                    txTarget = nextTx.result.txTarget;
                    txData = nextTx.result.txData;
                    value = nextTx.result.value;

                    // Checks if approval is needed 
                    if (nextTx.result.approvalData != null) {
                        console.log('Approval is needed', nextTx.result.approvalData);

                        let approvalTokenAddress = nextTx.result.approvalData.approvalTokenAddress;
                        let allowanceTarget = nextTx.result.approvalData.allowanceTarget;
                        let minimumApprovalAmount = nextTx.result.approvalData.minimumApprovalAmount;

                        // Signer is initiated with provider of destination chain RPC
                        let tx = await makeApprovalTx(approvalTokenAddress, allowanceTarget, minimumApprovalAmount, toSigner);
                        console.log('tx', tx);
                        await tx.wait().then(receipt => console.log('Destination Approve Tx', receipt.transactionHash))
                            .catch(e => console.log(e));
                    }
                    else {
                        console.log('Approval not needed');
                    }

                    // Sends destination swap transaction
                    const gasPrice = await toSigner.getGasPrice();
                    const sourceGasEstimate = await toProvider.estimateGas({
                        from: toSigner.address,
                        to: txTarget,
                        data: txData,
                        value: value,
                        gasPrice: gasPrice,
                        value: ethers.utils.parseEther("0")
                    });

                    const tx = await toSigner.sendTransaction({
                        from: toSigner.address,
                        to: txTarget,
                        data: txData,
                        value: value,
                        gasPrice: gasPrice,
                        gasLimit: sourceGasEstimate
                    });

                    const receipt = await tx.wait();
                    txHash = receipt.transactionHash;
                    console.log('Destination Socket Tx', txHash)
                }
            }
        }, 5000)

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
                {/* <button onClick={buildTx}>Build Transaction to bridge</button> */}
                <button onClick={transaction}>Transact</button>

            </div>}
        </div>
    )
}

export default SocketMulti