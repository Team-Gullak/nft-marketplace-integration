import { useState } from 'react'
// 645b2c8c-5825-4930-baf3-d9b997fcd88c
const Socket = () => {
    const [values, setValues] = useState({ fromChainId: "", toChainId: "", fromToken: '', toToken: '', amount: '' });
    const API_KEY = '645b2c8c-5825-4930-baf3-d9b997fcd88c';
    const userAddress = '0xd232979ed3fc90a331956C4e541815b478116a7D';

    const fetchFromTokens = async () => {

        try {

            const options = { method: 'GET', headers: { 'API-KEY': API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json', } };

            fetch(`https://backend.movr.network/v2/token-lists/from-token-list?fromChainId=${values.from}&toChainId=${values.to}`, options)
                .then(response => response.json())
                .then(response => console.log(response))
                .catch(err => console.error(err));

        } catch (error) {
            console.error(error);
        }
    }

    const fetchToTokens = async () => {

        try {

            const options = { method: 'GET', headers: { 'API-KEY': API_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json', } };

            fetch(`https://backend.movr.network/v2/token-lists/to-token-list?fromChainId=${values.from}&toChainId=${values.to}`, options)
            fetch(`https://backend.movr.network/v2/quote?fromChainId=${values.from}&fromTokenAddress=0x2791bca1f2de4661ed88a30c99a7a9449aa84174&toChainId=${values.to}&toTokenAddress=0xdac17f958d2ee523a2206206994597c13d831ec7&fromAmount=100000000&userAddress=0x3e8cB4bd04d81498aB4b94a392c334F5328b237b&uniqueRoutesPerBridge=true&sort=gas`, options)
                .then(response => response.json())
                .then(response => console.log(response))
                .catch(err => console.error(err));

        } catch (error) {
            console.error(error);
        }
    }


    const quote = async () => {
        console.log('VALUES', values)

        try {

            const options = { method: 'GET', headers: { 'API-KEY': '645b2c8c-5825-4930-baf3-d9b997fcd88c', 'Accept': 'application/json', 'Content-Type': 'application/json', } };

            fetch(`https://backend.movr.network/v2/quote?fromChainId=${values.fromChainId}&fromTokenAddress=${values.fromToken}&toChainId=${values.toChainId}&toTokenAddress=${values.toToken}&fromAmount=${values.amount}&userAddress=${userAddress}&uniqueRoutesPerBridge=true&sort=gas`
                , options)
                .then(response => response.json())
                .then(response => console.log(response.result.routes))
                .catch(err => console.error(err));

        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div style={{ margin: '10px' }}>
            <form >
                <div>
                    <input
                        style={{ width: '240px', padding: '10px', margin: '10px' }}
                        placeholder="Chain id of from"
                        onChange={(e) =>
                            setValues({ ...values, fromChainId: e.target.value })
                        }
                    />
                    <input
                        style={{ width: '240px', padding: '10px', margin: '10px' }}
                        placeholder="Chain id of  to"
                        onChange={(e) =>
                            setValues({ ...values, toChainId: e.target.value })
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
                        placeholder="To Token Address"
                        onChange={(e) =>
                            setValues({ ...values, toToken: e.target.value })
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
            <button onClick={quote}>Fetch Best routes to bridge</button>

        </div>
    )
}

export default Socket