export const getTokenPrice = async (address,chain,to_block) => {

    const API_KEY =`${process.env.REACT_APP_API_KEY}`

    if(address === undefined || address.length === 0)return
    const requestOptions = {
        method: 'GET',
        headers: { 'accept': 'application/json', 'X-API-Key' : API_KEY },
      };
    const res = await fetch(`https://deep-index.moralis.io/api/v2/erc20/${address}/price?chain=${chain}&to_block=${to_block?to_block:""}`, requestOptions)
    const price = await res.json()
    // console.log("price",price.usdPrice)
    return price.usdPrice

}