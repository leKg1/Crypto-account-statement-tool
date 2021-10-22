import React,{useState,useEffect} from 'react';

import { Input,InputGroup,Heading,Button,
    Link,
    Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    Stack,
    Editable, EditableInput, EditablePreview,
    Checkbox, CheckboxGroup 
   } from "@chakra-ui/react"
  
  import Moralis from "moralis";
  import { ethers } from "ethers";
  import _ from "lodash";
//   import { observer, Observer } from "mobx-react-lite"
//   import { usePolygonTransactions } from './polygonStore';
//   import { useEthTransactions } from './ethereumTransactionsStore';
//   import { useTokenTransfers } from './ethereumTokenTransfersStore';
//   import { useTokenMetada } from './ethereumTokenMetadataStore';
  import {
    Pagination,
    usePagination,
    PaginationNext,
    PaginationPage,
    PaginationPrevious,
    PaginationContainer,
    PaginationPageGroup,
    PaginationSeparator
  } from "@ajna/pagination";
  import { useMoralis } from "react-moralis";
  import { getTokenPrice } from "../getTokenPrice";
  const BN = require('bn.js');
  const API_KEY = `${process.env.REACT_APP_API_KEY}`;
  
  const fetchTransactions = async (address,pageSize,offset,chain) => {
    if(address === undefined || address.length === 0)return
    const requestOptions = {
        method: 'GET',
        headers: { 'accept': 'application/json', 'X-API-Key' : API_KEY },
      };
    const res = await fetch(`https://deep-index.moralis.io/api/v2/${address}?chain=${chain}&offset=${offset}&limit=${pageSize}`, requestOptions)
    const transactions = await res.json()
    console.log("Transactions",transactions)
    return transactions
  }
  
  const fetchTokenMetadata = async (address,chain) => {
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

  // const fetchTokenTransfers = async (address,pageSize,offset,chain) => {
  const fetchTokenTransfers = async (address,chain) => {
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

const Transactions = (props) => {
    const [walletAddress, setWalletAddress] = useState("");
    // const ethTokenTransfersStore = useTokenTransfers()
    const [ourLocalMoralisTxDetails, setOurLocalMoralisTxDetails] = useState([]);
    // const metadataStore = useTokenMetada()
    // const [ethTokenTransferRows, setEthTokenTransferRows] = useState([]);
    const [txsTotal, setTxsTotal] = useState(0);
    const [totalGas, setTotalGas] = useState(0);
    const [toUsdPrice, setToUsdPrice] = useState(0);
    const [transactionsRows, setTransactionsRows] = useState([]);
    const { isInitialized} = useMoralis();
    const [checkedCurrentPrice, setCheckedCurrentPrice] = useState(false);
    const [ourLocalMoralisAddresses, setOurLocalMoralisAddresses] = useState([]);
    const [isAddressBookChanged, setIsAddressBookChanged] = useState(false);
    const {
        currentPage,
        setCurrentPage,
        pagesCount,
        pages,
        offset,
        pageSize,
        setPageSize,
      } = usePagination({
        // pagesCount: 7,
        total: txsTotal,
        initialState: { 
          currentPage: 1,
          pageSize: 10, 
        },
      });
      const handlePageChange = (nextPage) => {
        // -> request new data using the page number
        setCurrentPage(nextPage);
        console.log("request new data with ->", nextPage);

      };
    
      const queryFromMoralis = async (txId) => {
        const queryTxDetails = new Moralis.Query("TxDetails");
        queryTxDetails.equalTo("txId", txId);
        const results = await queryTxDetails.find();  
        return results
      }
      const queryAddressBookFromMoralis = async (address) => {
        const queryAddressBook = new Moralis.Query("AddressBook");
        queryAddressBook.equalTo("address", address);
        const results = await queryAddressBook.find();  
        return results
      }
    
      const updateInMoralis = async (txId, description) => {
        const TxDetails = Moralis.Object.extend("TxDetails");
        const results = await queryFromMoralis(txId);
        console.log("results",results)
        if (results.length !== 0) {
          const objectId = results[0].id;
          const query = new Moralis.Query(TxDetails);
          const txDetails = await query.get(objectId);
          txDetails.set({
            description: description,
          });
          txDetails.save();
        } else {
          const txDetails = new TxDetails();
          await txDetails.save({
            txId: txId,
            description: description,
          });
        }
      };
      const updateAddressInMoralis = async (address, addressName) => {
        const AddressBook = Moralis.Object.extend("AddressBook");
        const results = await queryAddressBookFromMoralis(address);
        console.log("results",results)
        if (results.length !== 0) {
          const objectId = results[0].id;
          const query = new Moralis.Query(AddressBook);
          const addressBook = await query.get(objectId);
          addressBook.set({
            addressName: addressName,
          });
          addressBook.save();
        } else {
          const addressBook = new AddressBook();
          await addressBook.save({
            address: address,
            addressName: addressName,
          });
        }
      };
    
      useEffect(() => {
        if (isInitialized) {
          const queryTxDetails = new Moralis.Query("TxDetails");
          let ourTxDetails = new Map();
          queryTxDetails
            .find()
            .then((result) => {
              for (let i = 0; i < result.length; i++) {
                const eachResult = result[i];
                ourTxDetails.set(eachResult.get("txId"), eachResult);
              }
              setOurLocalMoralisTxDetails(ourTxDetails);
              console.log("ourTxDetails ", ourTxDetails);
            })
            .catch((err) => console.log(err));

        }
      }, [isInitialized,isAddressBookChanged])

      useEffect(() => {
        if (isInitialized) {
          const queryAddressBook = new Moralis.Query("AddressBook");
          let addressMap = new Map();
          queryAddressBook
            .find()
            .then((result) => {
              for (let i = 0; i < result.length; i++) {
                const eachResult = result[i];
                addressMap.set(eachResult.get("address"), eachResult);
              }
              setOurLocalMoralisAddresses(addressMap)
              console.log("addressMap ", addressMap);
            })
            .catch((err) => console.log(err));
        }
      }, [isInitialized,isAddressBookChanged])
    
      useEffect(() => {    
          fetchTransactions(walletAddress, pageSize, offset, props.chain)
            .then((jsonRes) => {
              if(jsonRes !== undefined){

                //call getERC20Transfers - return a list of transfer transactions. 
                fetchTokenTransfers(walletAddress,props.chain)
                .then((mapOfTokenTransfers) => {
                  console.log("mapOfTokenTransfers",mapOfTokenTransfers)
                //create Rows with the transactions
                getTransactionsRows(jsonRes,mapOfTokenTransfers)
                setTxsTotal(jsonRes.total)
              })
              .catch((error) => console.error("App =>", error));
              } 
            })
            .catch((error) => console.error("App =>", error));
        }, [currentPage, pageSize, offset, walletAddress, checkedCurrentPrice,isAddressBookChanged]);
    
    
      const getTransactionsRows = async (jsonRes,mapOfTokenTransfers) => {
        const transactions = [];
        let gasUsed;
    
        const currentPrice = await getTokenPrice(props.tokenPair,props.chain)
        setToUsdPrice(currentPrice);

        let ourTotalGasUsed = new BN(0)
        for (let index = 0; index < jsonRes.result.length; index++) {
          const tx = jsonRes.result[index];
          //check if this transaction is a erc20transfer
          if(mapOfTokenTransfers.has(tx.hash) === true){

            //add transfered amount
            tx.tokenValue =  mapOfTokenTransfers.get(tx.hash).value
            tx.contractAddress = mapOfTokenTransfers.get(tx.hash).address
            tx.tokenFromAddress = mapOfTokenTransfers.get(tx.hash).from_address
            tx.tokenToAddress = mapOfTokenTransfers.get(tx.hash).to_address

            //add the token symbol (call metadata)
            tx.metadata = await fetchTokenMetadata(tx.contractAddress,props.chain)
            
          }
          console.log("tx.metadata ",  tx.metadata )

        //  jsonRes.result.forEach((transaction, index) => {
          let gasUsed = ethers.utils.formatEther(
            ethers.utils.parseUnits(tx.receipt_gas_used.toString(), "gwei"),
            { pad: true }
          );

          const ethPriceAtTxTime = await getTokenPrice(props.tokenPair,props.chain,tx.block_number)
          const tokenPrice = (tx.metadata !== undefined) ? (await getTokenPrice(tx.metadata.address,props.chain)):0
          const tokenPriceAtTxTime  = (tx.metadata !== undefined) ? (await getTokenPrice(tx.metadata.address,props.chain,tx.block_number)) : 0

          const newTokenPrice = tokenPrice.toFixed(2)
          const newTokenPriceAtTxTime = tokenPriceAtTxTime.toFixed(2)
          const newTokenValue = parseInt(tx.tokenValue?tx.tokenValue:0)
          console.log("newTokenPriceAtTxTime",newTokenPriceAtTxTime);
          console.log("newTokenPrice",newTokenPrice);
          console.log("newTokenValue",newTokenValue);
          
          transactions.push(
            <Tr key={index}>
              <Td>
                <Link
                  href={`${props.url}${tx.hash}`}
                  isExternal
                >
                  {tx.block_timestamp}
                </Link>
              </Td>
              <Td>
              <Editable
                defaultValue={
                  ourLocalMoralisTxDetails.get(tx.hash) !== undefined
                    ? ourLocalMoralisTxDetails.get(tx.hash).attributes.description
                    : "edit"
                }
              >
                <EditablePreview />
                <EditableInput
                  onBlur={async (e) => {
                    await updateInMoralis(tx.hash, e.target.value);
                    const newMap = ourLocalMoralisTxDetails;
                    newMap.set(tx.hash, e.target.value);
                    setOurLocalMoralisTxDetails(newMap);
                  }}
                />
              </Editable>
              </Td>

              {/*<Td>{tx.from_address}</Td>*/}
              <Td><Editable
              defaultValue={
                ourLocalMoralisAddresses.get(tx.from_address) !== undefined
                  ? ourLocalMoralisAddresses.get(tx.from_address).attributes.addressName
                  : tx.from_address
              }
            >
              <EditablePreview />
              <EditableInput
                onBlur={async (e) => {
                  await updateAddressInMoralis(tx.from_address, e.target.value);
                  const newMap = ourLocalMoralisAddresses;
                  newMap.set(tx.from_address, e.target.value);
                  setOurLocalMoralisAddresses(newMap);
                  setIsAddressBookChanged(!isAddressBookChanged)
                }}
              />
            </Editable></Td>

            {/*<Td>{tx.to_address}</Td>*/}
            <Td><Editable
              defaultValue={
                ourLocalMoralisAddresses.get(tx.to_address) !== undefined
                  ? ourLocalMoralisAddresses.get(tx.to_address).attributes.addressName
                  : tx.to_address
              }
            >
              <EditablePreview />
              <EditableInput
                onBlur={async (e) => {
                  await updateAddressInMoralis(tx.to_address, e.target.value);
                  const newMap = ourLocalMoralisAddresses;
                  newMap.set(tx.to_address, e.target.value);
                  setOurLocalMoralisAddresses(newMap);
                  setIsAddressBookChanged(!isAddressBookChanged)
                }}
              />
            </Editable></Td>

              <Td isNumeric>{gasUsed}</Td>
              <Td isNumeric>{checkedCurrentPrice? (gasUsed * currentPrice) : (gasUsed * ethPriceAtTxTime)}</Td>

              <Td isNumeric>
                {
                  (walletAddress !== tx.to_address)?ethers.utils.formatEther((tx.value * (-1)).toString(), {
                  pad: true,
                }) : (ethers.utils.formatEther(tx.value.toString(), {
                  pad: true,
                }))
                }
              </Td>
              
              <Td isNumeric>
                {checkedCurrentPrice ? ((walletAddress !== tx.to_address)?(ethers.utils.formatEther((tx.value * (-1) * currentPrice).toString(), {
                  pad: true,
                })) : (ethers.utils.formatEther((tx.value * currentPrice).toString(), {
                  pad: true,
                }))) : ((walletAddress !== tx.to_address)?(ethers.utils.formatEther((tx.value * (-1) * ethPriceAtTxTime).toString(), {
                  pad: true,
                })) : (ethers.utils.formatEther((tx.value * ethPriceAtTxTime).toString(), {
                  pad: true,
                })))}
              </Td>


              <Td isNumeric>
                {
                  (walletAddress !== (tx.tokentoAddress!==undefined?tx.tokentoAddress:''))?(ethers.utils.formatUnits(new BN(tx.tokenValue).toString(),tx.metadata!==undefined?tx.metadata.decimals:18) * (-1))
                : 
                (ethers.utils.formatUnits(new BN(tx.tokenValue).toString(),tx.metadata!==undefined?tx.metadata.decimals:18))
                }
                &nbsp;{tx.metadata!==undefined?tx.metadata.symbol:''}
              </Td>

              <Td>{
                checkedCurrentPrice ?
                ((walletAddress !== (tx.tokentoAddress!==undefined?tx.tokentoAddress:''))
                ?
                (ethers.utils.formatUnits((newTokenPrice * newTokenValue * (-1)).toString(),tx.metadata!==undefined?tx.metadata.decimals:18))
                : 
                (ethers.utils.formatUnits((newTokenPrice * newTokenValue).toString(),tx.metadata!==undefined?tx.metadata.decimals:18)))

                :

                ((walletAddress !== (tx.tokentoAddress!==undefined?tx.tokentoAddress:''))
                ?
                (ethers.utils.formatUnits((newTokenPriceAtTxTime * newTokenValue * (-1)).toString(),tx.metadata!==undefined?tx.metadata.decimals:18))
                : 
                (ethers.utils.formatUnits((newTokenPriceAtTxTime * newTokenValue).toString(),tx.metadata!==undefined?tx.metadata.decimals:18)))
                
              }</Td>

            </Tr>
          );
          ourTotalGasUsed = ourTotalGasUsed.add(new BN(tx.receipt_gas_used));
        // }
        // }
      }
        // );
    
        setTotalGas(ourTotalGasUsed.toString(10));
        setTransactionsRows(transactions);
      }
return (
  <div>
    <Pagination
      pagesCount={pagesCount}
      currentPage={currentPage}
      onPageChange={handlePageChange}
    >
      <PaginationContainer
        align="center"
        justify="space-between"
        p={4}
        w="full"
      >
        <PaginationPrevious
          _hover={{
            bg: "purple.400",
          }}
          bg="purple.300"
          onClick={() =>
            console.log(
              "Im executing my own function along with Previous component functionality"
            )
          }
        >
          Previous
        </PaginationPrevious>
        <PaginationPageGroup
          isInline
          align="center"
          separator={
            <PaginationSeparator
              onClick={() =>
                console.log(
                  "Im executing my own function along with Separator component functionality"
                )
              }
              bg="blue.300"
              fontSize="sm"
              w={7}
              jumpSize={11}
            />
          }
        >
          {pages.map((page) => (
            <PaginationPage
              w={7}
              bg="purple.300"
              key={`pagination_page_${page}`}
              page={page}
              onClick={() =>
                console.log(
                  "Im executing my own function along with Page component functionality"
                )
              }
              fontSize="sm"
              _hover={{
                bg: "green.300",
              }}
              _current={{
                bg: "green.300",
                fontSize: "sm",
                w: 7,
              }}
            />
          ))}
        </PaginationPageGroup>
        <PaginationNext
          _hover={{
            bg: "purple.400",
          }}
          bg="purple.300"
          onClick={() =>
            console.log(
              "Im executing my own function along with Next component functionality"
            )
          }
        >
          Next
        </PaginationNext>
      </PaginationContainer>
    </Pagination>

    <Heading size="md" align="center" fontSize="40px" pt={2}>
      {props.label} Transactions
    </Heading>
    <InputGroup size="md" m={2}>
      <Input
        pr="4.5rem"
        defaultValue={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        placeholder="Enter token address"
      />
    </InputGroup>
    <br></br>
    <br></br>
    <Stack ml="1%">
      <p>
        current price ({props.chain}-usd): {toUsdPrice}
      </p>
    </Stack>
    <br></br>
    <Stack ml="80%">
      <Checkbox
        isChecked={checkedCurrentPrice}
        onChange={(e) => setCheckedCurrentPrice(e.target.checked)}
      >
        Show current USD price
      </Checkbox>
    </Stack>
    <br></br>
    <Table variant="striped" colorScheme="blackAlpha" size="sm">
      <TableCaption>{props.label} account transactions</TableCaption>
      <Thead pt={2}>
        <Tr>
          <Th>Transaction timestamp</Th>
          <Th>Description</Th>
          <Th>From Address</Th>
          <Th>To Address</Th>
          <Th isNumeric>Gas used ({props.chain})</Th>
          <Th isNumeric>
            {checkedCurrentPrice
              ? "Gas used (USD - current price)"
              : "Gas used (USD - price at tx-time)"}
          </Th>
          <Th isNumeric>Value ({props.chain})</Th>
          <Th isNumeric>
            {checkedCurrentPrice
              ? "Value (USD - current price)"
              : "Value (USD - price at tx-time)"}
          </Th>
          <Th isNumeric>ERC20Value</Th>
          <Th isNumeric>
            {checkedCurrentPrice
              ? "ERC20Value (in USD - current price)"
              : "ERC20Value (in USD - price at tx-time)"}
          </Th>
        </Tr>
      </Thead>
      <Tbody>{transactionsRows.length > 0 ? transactionsRows : null}</Tbody>
      <Tfoot>
        <Tr>
          <Th>Total Gas:</Th>
          <Th isNumeric>
            Gas:{ethers.utils.formatEther(totalGas, { pad: true })}
          </Th>
        </Tr>
      </Tfoot>
    </Table>
  </div>
);
}
export default Transactions