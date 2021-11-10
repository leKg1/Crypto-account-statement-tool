const API_KEY = `${process.env.REACT_APP_API_KEY}`;

 export const fetchTokenTransfers = async (address,chain) => {
    let erc20TokenTransferMap = new Map();
    if (address === undefined || address.length === 0) return;
    
    const requestOptions = {
      method: "GET",
      headers: { accept: "application/json", "X-API-Key": API_KEY },
    };

    // const res = await fetch(`https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${chain}&offset=${offset}&limit=${pageSize}`, requestOptions)
    const res = await fetch(`https://deep-index.moralis.io/api/v2/${address}/erc20/transfers?chain=${chain}`, requestOptions)
    const tokenTransfers = await res.json()
    for (let index = 0; index < tokenTransfers.result.length; index++) {
            const erc20Transfer = tokenTransfers.result[index];
            erc20TokenTransferMap.set(erc20Transfer.transaction_hash, erc20Transfer)
    }
    return erc20TokenTransferMap;
  }