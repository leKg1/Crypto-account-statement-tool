const API_KEY = `${process.env.REACT_APP_API_KEY}`;
  
export const fetchTransactions = async (address, pageSize, offset, chain) => {
    if (address === undefined || address.length === 0) return;
    const requestOptions = {
      method: "GET",
      headers: { accept: "application/json", "X-API-Key": API_KEY },
    };
    const res = await fetch(
      `https://deep-index.moralis.io/api/v2/${address}?chain=${chain}&offset=${offset}&limit=${pageSize}`,
      requestOptions
    );
    const transactions = await res.json();
    console.log("Transactions", transactions);
    return transactions;
  };
  