import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers';
const ERC20_ABI = require('../ERC_20.json')
const bungee = () => {

    const chains = [
        {
            "chainId": 1,
            "name": "Ethereum",
            "icon": "https://movricons.s3.ap-south-1.amazonaws.com/Ether.svg",
        },
        {
            "chainId": 10,
            "name": "Optimism",
            "icon": "https://movricons.s3.ap-south-1.amazonaws.com/Optimism.svg",
        },
        {
            "chainId": 56,
            "name": "BSC",
            "icon": "https://movricons.s3.ap-south-1.amazonaws.com/BSC.svg",
        },
        {
            "chainId": 100,
            "name": "Gnosis",
            "icon": "https://movricons.s3.ap-south-1.amazonaws.com/gnosis.svg",
        },
        {
            "chainId": 137,
            "name": "Polygon",
            "icon": "https://movricons.s3.ap-south-1.amazonaws.com/Matic.svg",
        },
        {
            "chainId": 250,
            "name": "Fantom",
            "icon": "https://movricons.s3.ap-south-1.amazonaws.com/Fantom.svg",
        },
        {
            "chainId": 42161,
            "name": "Arbitrum",
            "icon": "https://movricons.s3.ap-south-1.amazonaws.com/Arbitrum.svg",
        },
        {
            "chainId": 43114,
            "name": "Avalanche",
            "icon": "https://movricons.s3.ap-south-1.amazonaws.com/Avalanche.svg",
        },
        {
            "chainId": 1313161554,
            "name": "Aurora",
            "icon": "https://movricons.s3.ap-south-1.amazonaws.com/aurora.svg",
        }
    ]
    const API_KEY = 'f09a7c60-cc6f-4656-ad1b-ac8879df3424';

    const [values, setValues] = useState({ fromChainId: "137", toChainId: "1", fromToken: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', toToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', amount: '100' });


    const [selectedChain, setSelectedChain] = useState();
    const [selectedToken, setSelectedToken] = useState();
    const [coinsFrom, setCoinsFrom] = useState([])
    const [coinsTo, setCoinsTo] = useState([])
    const [isLoading, setIsLoading] = useState(false);

    const fetchFromTokens = async () => {

        try {

            const options = { method: 'GET', headers: { 'API-KEY': API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json', } };

            const res = await fetch(`https://backend.movr.network/v2/token-lists/from-token-list?fromChainId=${values.fromChainId}&toChainId=1&isShortList=true`, options)
            const data = await res.json();
            setCoinsFrom(data.result);

        } catch (error) {
            console.error(error);
        }
    }

    const fetchToTokens = async () => {

        try {

            const options = { method: 'GET', headers: { 'API-KEY': API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json', } };

            const res = await fetch(`https://backend.movr.network/v2/token-lists/to-token-list?fromChainId=${values.fromChainId}&toChainId=${values.toChainId}`, options)

            const data = await res.json();
            setCoinsTo(data.result);

        } catch (error) {
            console.error(error);
        }
    }


    const getQuote = async () => {

        try {


            const options = {
                method: 'GET', headers: {
                    'API-KEY': API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json'
                }
            };

            const res = await fetch(`https://backend.movr.network/v2/quote?fromChainId=${values.fromChainId}&fromTokenAddress=${values.fromToken}&toChainId=${values.toChainId}&toTokenAddress=${values.toToken}&fromAmount=${values.amount}&userAddress=${values.userAddress}&uniqueRoutesPerBridge=true&sort=gas&singleTxOnly=false`, options)

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


    const requestAccount = async () => {
        await window.ethereum.request({ method: 'eth_requestAccounts' })
    }

    // Main function 
    const transaction = async () => {

        await requestAccount();
        const fromProvider = new ethers.providers.Web3Provider(window.ethereum);
        const fromSigner = fromProvider.getSigner();

        const toProvider = new ethers.providers.EtherscanProvider(
            'rinkeby',
            `${process.env.NEXT_PUBLIC_API}`
        )
        const toSigner = new ethers.Wallet(`${process.env.NEXT_PUBLIC_PRIVATE}`, toProvider);

        let activeRouteId; // These are retrieved and assinged from /route/start
        let userTxIndex; // These are retrieved and assinged from /route/start
        let txTarget;
        let txData;
        let value;
        setIsLoading(true)

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
        let retry = 0;
        const status = setInterval(async () => {
            // Gets status of route journey 
            const status = await prepareNextTx(activeRouteId, userTxIndex, txHash);
            console.log("Current status :", status.result);

            // Exits setInterval if route is 'completed'
            if (status.result == 'completed') {
                console.log('Bridging transaction is complete');
                retry = 0;
                setIsLoading(false);
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
                    return tx;

                }
            }
            if (retry > 10) {
                console.log('Bridging transaction failed');
                setIsLoading(false);
                clearInterval(status);
            }
            retry++;

        }, 5000)

    }

    useEffect(() => {
        fetchFromTokens();
        fetchToTokens();
    }, [values.fromToken, values.toToken]);


    return (
        <div className='bg-black text-white h-screen overflow-hidden w-full flex items-center justify-center font-sans'>
            <div className='justify-center bg-[#FFFFFF] h-[36rem] w-[32rem] rounded-lg text-black p-6 flex flex-col space-y-7 items-center '>
                <p className='text-2xl font-bold'>Swap/Bridge Tokens </p>
                <div className='mt-4'>
                    <div className='flex items-center justify-between space-x-10'>
                        <div className='flex-[0.5]'>
                            <p className='text-sm'>Transfer From : </p>
                            <select className="border border-gray-300 rounded-lg text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-black focus:outline-none appearance-none w-52" onChange={e => setValues({ ...values, fromChainId: e.target.value })}>
                                <option>Choose a chain</option>
                                {chains.map(chain => (
                                    <option key={chain.chainId} value={chain.chainId}> {chain.name}</option>
                                )
                                )}

                            </select>
                        </div>
                        <div className='flex-[0.5]'>
                            <p className='text-sm'>Transfer To : </p>
                            <select className="border border-gray-300 rounded-lg text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-black focus:outline-none appearance-none  w-52" onChange={e => setValues({ ...values, toChainId: e.target.value })} >
                                <option>Choose a chain</option>
                                {chains.map(chain => (
                                    <option value={chain.chainId}>{chain.name}</option>
                                )
                                )}
                            </select>
                        </div>
                    </div>
                </div>
                <div className='mt-4'>
                    <div className='flex items-center justify-center space-x-10'>
                        <div className='flex-[0.5]'>
                            <p className='text-sm'>Transfer Token From : </p>
                            <select className="border border-gray-300 rounded-lg text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-black focus:outline-none appearance-none  w-52" onChange={e => setValues({ ...values, fromToken: e.target.value })}>
                                <option>Choose a Token</option>
                                {coinsFrom?.map(coin => (

                                    <option value={coin.address}>{coin.symbol}</option>
                                )
                                )}

                            </select>
                        </div >
                        <div className='flex-[0.5]'>
                            <p className='text-sm'>Transfer Token To : </p>
                            <select className="border border-gray-300 rounded-lg text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-black focus:outline-none appearance-none  w-52" onChange={e => setValues({ ...values, toToken: e.target.value })}>
                                <option>Choose a Token</option>
                                {coinsTo?.map(coin => (
                                    <option value={coin.address}>{coin.symbol}</option>
                                )
                                )}
                            </select>
                        </div>

                    </div>
                </div>
                <div className='mt-4'>
                    <div className='flex justify-between'>
                        <p className='text-sm'>Amount :</p>
                    </div>
                    <input required type='number' className='p-4  hover:border-black border-[1px] rounded-lg  focus:outline-none w-full mt-2' placeholder='Your contribution' value={values.amount} onChange={(e) => setValues({ ...values, amount: e.target.value })} />

                </div>
                <button onClick={transaction} className='w-full mt-4 p-3 hover:border-black border-[1px] rounded-lg text-black flex items-center justify-center space-x-4'>
                    <span>Swap</span>
                </button>
            </div>
            {
                isLoading && (
                    <div class="h-screen absolute inset-0  opacity-50 bg-black">
                        <div class="flex justify-center items-center h-full">
                            <img class="h-16 w-16" src="https://icons8.com/preloaders/preloaders/1488/Iphone-spinner-2.gif" alt="" />
                            {/* <p>Loading...</p> */}
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default bungee