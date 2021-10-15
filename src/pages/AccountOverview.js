import React,{useState,useEffect} from 'react';
import Transactions from '../components/Transactions';
// import PolygonTransactions from '../components/PolygonTransactions';

const AccountOverview = () => {
return (
    <div>
    <Transactions 
        url={"https://etherscan.io/tx/"} 
        chain={"eth"}  
        label={"Ethereum"}
        tokenPair={"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"} 
    />
    <Transactions
        url={"https://polygonscan.com/tx/"} 
        chain={"matic"}
        label={"Polygon"} 
        tokenPair={"0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"} 
    />
    </div>
)
}
export default AccountOverview