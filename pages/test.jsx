import React from "react";
const API_KEY =
    "YgOUcYlTNyBe0czxTWvruHCI9dbzkUQj7592RL1fEAakq0XdWughgAXZMA4s7k73";

const usd = 1782;

export default function App() {
    const userAddress = "0x6d4b5acFB1C08127e8553CC41A9aC8F06610eFc7";
    const [score, setScore] = React.useState(0);
    const [values, setValues] = React.useState([]);
    const [balance, setBalance] = React.useState(0);

    const getErcDecimal = async (tokenAddress) => {
        try {
            const options = {
                method: "GET",
                headers: {
                    "X-API-Key": API_KEY,
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            };

            const res = await fetch(
                `https://deep-index.moralis.io/api/v2/erc20/metadata?chain=rinkeby&addresses=${tokenAddress}`,
                options
            );

            let data = await res.json();
            return parseInt(data[0].decimals);
        } catch (error) {
            console.error(error);
        }
    };

    const getTransactions = async () => {
        try {
            const options = {
                method: "GET",
                headers: {
                    "X-API-Key": API_KEY,
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            };

            const res = await fetch(
                `https://deep-index.moralis.io/api/v2/${userAddress}/erc20/transfers?chain=rinkeby`,
                options
            );

            let data = await res.json();

            console.log("data", data.result);
            setValues(data.result);
        } catch (error) {
            console.error(error);
        }
    };

    const calScore = async () => {
        console.log('clicked')
        values.forEach((e) => {
            // console.log('Address : ', e.address)
            let decimal;
            decimal = getErcDecimal(e.address);
            decimal.then(res => {

                console.log('Decimal : ', res)
                console.log(e.from_address)
                if (e.from_address === userAddress) {
                    console.log('-')
                    setScore(score - (e.value / 10 ** res) * usd)
                }
                else {
                    console.log('+')
                    setScore(score + (e.value / 10 ** res) * usd)
                }
            });
        });
    };

    const getBalance = async () => {
        try {
            const options = {
                method: "GET",
                headers: {
                    "X-API-Key": API_KEY,
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            };
            const res = await fetch(
                `https://deep-index.moralis.io/api/v2/${userAddress}/erc20?chain=rinkeby`,
                options
            );
            let data = await res.json();
            let balance = 0;
            console.log("data", data);
            (data).forEach((e) => {
                console.log(e.balance / 10 ** parseInt(e.decimals))
                // console.log(e.decimals)
                balance = balance + (e.balance / 10 ** parseInt(e.decimals));
            });
            return balance;
        } catch (error) {
            console.error(error);
        }
    };


    const update = async () => {
        const balance = await getBalance();
        // console.log('Balance : ', balance);
        setScore(score + balance / 100);

        // setTimeout(update, 4000);
        // 86400000
    }
    // update();

    return (
        <>
            <div className="App flex space-x-6 m-4">
                <button className="p-2 rounded-lg border-2 border-black" onClick={getTransactions}>getTransactions</button>
                <button className="p-2 rounded-lg border-2 border-black" onClick={calScore}>calScore</button>
                <button className="p-2 rounded-lg border-2 border-black" onClick={update}>update</button>
            </div>
            <p className="p-2 w-36 m-4 rounded-lg border-2 border-black">{score}</p>
        </>
    );
}