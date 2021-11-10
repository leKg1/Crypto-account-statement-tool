const API_KEY = `${process.env.REACT_APP_API_KEY}`;

export const fetchTokenMetadata = async (address,chain) => {
    if (address === undefined || address.length === 0) return;
    const requestOptions = {
      method: "GET",
      headers: { accept: "application/json", "X-API-Key": API_KEY },
    };
    const metaResponse = await fetch(
      `https://deep-index.moralis.io/api/v2/erc20/metadata?chain=${chain}&addresses=${address}`,
      requestOptions
    );
    const metadata = await metaResponse.json()
    if(metadata !== undefined || metadata.length !== 0) return metadata[0]

    return undefined;
  }