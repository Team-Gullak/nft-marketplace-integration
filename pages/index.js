import { useState } from 'react'

import Web3 from 'web3'
import { ethers } from 'ethers'

import Safe, { SafeFactory } from '@gnosis.pm/safe-core-sdk'
import EthersAdapter from '@gnosis.pm/safe-ethers-lib'
import { contractABI } from '../contractABI'

const opensea = require("opensea-js");
const { WyvernSchemaName } = require('opensea-js/lib/types');
import { OrderSide } from 'opensea-js/lib/types'
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;

const HDWalletProvider = require("@truffle/hdwallet-provider");
const HOT_WALLET_ADDRESS = '0xd232979ed3fc90a331956C4e541815b478116a7D';

//bignumber to number string
const bnToString = (bn) => {
  return ethers.utils.formatEther(bn.toString(10)).toString();
}

const Home = () => {

  const [values, setValues] = useState({ tokenAddress: "", tokenId: "" });

  const provider = new HDWalletProvider({
    privateKeys: [`${process.env.NEXT_PUBLIC_PRIVATE}`,],
    providerOrUrl: `https://speedy-nodes-nyc.moralis.io/${process.env.NEXT_PUBLIC_URL}/eth/rinkeby`
  });

  const seaport = new OpenSeaPort(
    provider,
    {
      networkName: Network.Rinkeby,
      apiKey: "",
    },
    (arg) => console.log(arg)
  );

  const createSellOrder = async () => {
    console.log("Creating a sellorder of item for a fixed price...");
    try {
      const res = await seaport.api.getAsset({
        tokenAddress: values.tokenAddress,
        tokenId: values.tokenId,
      })
      const type = res.assetContract.schemaName === 'ERC721' ? WyvernSchemaName.ERC721 : WyvernSchemaName.ERC1155;

      const fixedPriceSellOrder = await seaport.createSellOrder({
        asset: {
          tokenId: values.tokenId,
          tokenAddress: values.tokenAddress,
          schemaName: type
        },
        startAmount: 1,
        expirationTime: Math.round(Date.now() / 1000 + 60 * 60 * 24 * 30),
        accountAddress: HOT_WALLET_ADDRESS,
      });
      console.log(
        `Successfully created a fixed-price sell order! ${fixedPriceSellOrder.asset.openseaLink}`
      );
    } catch (error) {
      console.error(error)
    }
  }

  const createBuyOrder = async () => {
    // Example: simple fixed-price sale of an item owned by a user.
    console.log("Creating a buy order of item for a fixed price...");
    try {
      const res = await seaport.api.getAsset({
        tokenAddress: values.tokenAddress,
        tokenId: values.tokenId,
      })
      const type = res.assetContract.schemaName === 'ERC721' ? WyvernSchemaName.ERC721 : WyvernSchemaName.ERC1155;

      const fixedPriceBuyOrder = await seaport.createBuyOrder({
        asset: {
          tokenId: values.tokenId,
          tokenAddress: values.tokenAddress,
          schemaName: type
        },
        startAmount: 0.00001,
        accountAddress: HOT_WALLET_ADDRESS,
      });
      console.log(
        `Successfully created a fixed-price sell order! ${fixedPriceBuyOrder.asset.openseaLink}\n`
      );
    } catch (error) {
      console.error(error)
    }
  }

  const getAsset = async () => {
    try {
      const res = await seaport.api.getAsset({
        tokenAddress: values.tokenAddress,
        tokenId: values.tokenId,
      })
      console.log(res);
      return res;

    } catch (error) {
      console.error(error);
    }
  };


  const getSellOrder = async () => {
    try {
      const { orders, count } = await seaport.api.getOrders({
        asset_contract_address: values.tokenAddress,
        token_id: values.tokenId,
        side: OrderSide.Sell
      })
      orders.sort((a, b) => a.currentPrice - b.currentPrice);
      console.log('Sell Orders', count, orders)
      console.log(bnToString(orders[0]?.currentPrice))

      return orders[0];


    } catch (error) {
      console.error(error);
    }
  };
  const getBuyOrder = async () => {
    try {
      const { orders, count } = await seaport.api.getOrders({
        asset_contract_address: values.tokenAddress,
        token_id: values.tokenId,
        side: OrderSide.Buy
      })

      console.log('Buy Orders', count, orders)

      return (bnToString(orders[0]?.currentPrice));
    } catch (error) {
      console.error(error);
    }
  };

  // Get offers (bids), a.k.a. orders where `side == 0`
  // Get page 2 of all auctions, a.k.a. orders where `side == 1`

  // Buying items
  const fulfillBuyOrder = async (safeAddress, order) => {
    try {

      const order = await seaport.api.getOrder({
        side: OrderSide.Sell,
        asset_contract_address: values.tokenAddress,
        token_id: values.tokenId,
      })

      console.log('fulfilling the orders', order)

      const accountAddress = HOT_WALLET_ADDRESS // The buyer's wallet address, also the taker
      const transactionHash = await seaport.fulfillOrder({ order, accountAddress, recipientAddress: safeAddress })

      console.log(transactionHash)

    } catch (error) {

      console.error('Error in fullfilling the order', error);
    }
  }

  const getContract = async (owner) => {
    try {

      const provider = (new Web3.providers.HttpProvider(`https://speedy-nodes-nyc.moralis.io/${process.env.NEXT_PUBLIC_URL}/eth/rinkeby`))
      const web3 = new Web3(provider);

      const res = await fetch(`https://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=${values.tokenAddress}&apikey=${process.env.NEXT_PUBLIC_API}`)

      const data = await res.json();
      const contractABI = JSON.parse(data.result);
      console.log('contract abi', contractABI)

      const contract = new web3.eth.Contract(contractABI, values.tokenAddress, {
        from: owner,
      });
      console.log('contract', contract)
      if (!contract) {
        console.error(`Contract ${owner} not found on provider`)
      }
      console.log('contractInstance', contract);

      return contract

    } catch (error) {
      console.error(error);
    }
  }

  const createSafe = async () => {
    try {
      const owner = new ethers.Wallet(
        `${process.env.NEXT_PUBLIC_PRIVATE_2}`,
        new ethers.providers.EtherscanProvider(
          'rinkeby',
          `${process.env.NEXT_PUBLIC_API}`
        )
      );

      const adapter = new EthersAdapter({
        ethers,
        signer: owner,
      });
      // ---
      console.log('SafeFactory is ready to create a new Safe')

      const safeFactory = await SafeFactory.create({
        ethAdapter: adapter,
        isL1SafeMasterCopy: true,
      });
      console.log('SafeFactory created')


      const safeAccountConfig = {
        owners: ['0x1d74e137C860D147eC6B1758900BCB33D023e43C'],
        threshold: 1,
        // ... (optional params)
      }
      const callback = (txHash) => {
        console.log({ txHash })
      }

      console.log('SafeFactory started deploying')
      let safeSdk = await safeFactory.deploySafe({ safeAccountConfig, callback });
      console.log('SafeFactory Deployed')

      const newSafeAddress = safeSdk.getAddress();
      console.log('newSafeAddress', newSafeAddress) 


      const sdk = await Safe.create({
        ethAdapter: adapter,
        safeAddress: newSafeAddress,
      });
      console.log('Sdk created', sdk)

      console.log('Safe created', newSafeAddress)
    } catch (err) {
      console.error(err);
    }
  };

  const returnFunds = async (owner) => {
    try {

      const tx = {
        from: send_account,
        to: to_address,
        value: ethers.utils.parseEther(send_token_amount),
        nonce: window.ethersProvider.getTransactionCount(send_account, "latest"),
        gasLimit: ethers.utils.hexlify(gas_limit), // 100000
        gasPrice: gas_price,
      }

      owner.sendTransaction(tx).then((transaction) => {
        console.dir(transaction)
        alert("Send finished!")
      })

    } catch (e) {
      console.error(e)
    }
  }

  const transactionBuy = async () => {
    const safeAddress = '0x67407721B109232BfF825F186c8066045cFefe7F';

    if (!values.tokenAddress || !values.tokenId) {
      alert('Please enter the token address and token id')
      return
    }

    try {

      const order = await getSellOrder();
      const buyPrice = bnToString(order.currentPrice);

      if (!buyPrice) { return }
      alert(`Buy Price: ${buyPrice}`);

      const owner = new ethers.Wallet(
        `${process.env.NEXT_PUBLIC_PRIVATE_2}`,
        new ethers.providers.EtherscanProvider(
          'rinkeby',
          `${process.env.NEXT_PUBLIC_API}`
        )
      );
      // ---
      const adapter = new EthersAdapter({
        ethers,
        signer: owner,
      });

      const sdk = await Safe.create({
        ethAdapter: adapter,
        safeAddress,
      });

      console.log('Owners: ', await sdk.getOwners());
      console.log('Balance: ', await sdk.getBalance());

      const transactions = [
        {
          to: HOT_WALLET_ADDRESS,
          data: '0x',
          value: ethers.utils.parseEther(buyPrice),
        },
      ];

      const safeTransaction = await sdk.createTransaction(transactions);
      console.log('Safe Transaction: ', safeTransaction);

      await sdk.signTransaction(safeTransaction);

      const executeTxResponse = await sdk.executeTransaction(safeTransaction);
      await executeTxResponse.transactionResponse.wait();
      console.log(executeTxResponse);

      const status = 
      await fulfillBuyOrder(safeAddress, order);

    } catch (err) {
      console.error(err);
    }
  };

  const transactionSell = async () => {
    const safeAddress = '0x67407721B109232BfF825F186c8066045cFefe7F';

    if (!values.tokenAddress || !values.tokenId) {
      alert('Please enter the token address and token id')
      return
    }

    try {

      const owner = new ethers.Wallet(
        `${process.env.NEXT_PUBLIC_PRIVATE_2}`,
        new ethers.providers.EtherscanProvider(
          'rinkeby',
          `${process.env.NEXT_PUBLIC_API}`
        )
      );
      // ---
      const adapter = new EthersAdapter({
        ethers,
        signer: owner,
      });

      const sdk = await Safe.create({
        ethAdapter: adapter,
        safeAddress,
      });

      const owners = await sdk.getOwners();
      console.log('Owners: ', owners);
      console.log('Balance: ', (await sdk.getBalance()).toString());
      const safeOwner = owners[0];

      const contract = await getContract(safeOwner)

      const transactions = [
        {
          to: values.tokenAddress,
          value: "0x0",
          data: contract.methods.transferFrom(safeAddress, HOT_WALLET_ADDRESS, values.tokenId).encodeABI(),
        },
      ];

      const safeTransaction = await sdk.createTransaction(transactions);
      console.log('Safe Transaction: ', safeTransaction);

      await sdk.signTransaction(safeTransaction);

      const executeTxResponse = await sdk.executeTransaction(safeTransaction);
      await executeTxResponse.transactionResponse.wait();
      console.log(executeTxResponse);

      await createSellOrder();

      alert('Successfully created a fixed-price sell order!')

    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div style={{ margin: '10px' }}>
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

      <button onClick={createSafe}>Create Safe</button>
      <button onClick={getAsset}>Get Asset</button>
      <button onClick={getBuyOrder}>Get Buy Orders</button>
      <button onClick={getSellOrder}>Get Sell Orders</button>
      <button onClick={transactionBuy}>Create Transaction to buy</button>
      <button onClick={transactionSell}>Create Transaction to sell</button>
    </div>
  )
}

export default Home