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
    Editable, EditableInput, EditablePreview
   } from "@chakra-ui/react"
  
  import Moralis from "moralis";
  import { ethers } from "ethers";
  import { ChainId, Token, WETH, Fetcher, Route } from "@uniswap/sdk";
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
  const BN = require('bn.js');
  const API_KEY =`${process.env.REACT_APP_API_KEY}`
  
  
  const fetchPolygonTransactions = async (address,pageSize,offset) => {
    // const options = { chain: "polygon", address: address, order: "desc" };
    // const transactions = await Moralis.Web3.getTransactions(options);
    const requestOptions = {
        method: 'GET',
        headers: { 'accept': 'application/json', 'X-API-Key' : API_KEY },
      };
    const res = await fetch(`https://deep-index.moralis.io/api/v2/${address}?chain=polygon&offset=${offset}&limit=${pageSize}`, requestOptions)
    const transactions = await res.json()
    console.log("PolygonTransactions",transactions)
    return transactions
  }

const PolygonTransactions = () => {
    const [token, setToken] = useState("");
    const [ourLocalMoralisTxDetails, setOurLocalMoralisTxDetails] = useState([]);
    // const metadataStore = useTokenMetada()
    const [polygonTransactionsRows, setPolygonTransactionsRows] = useState([]);
    const [polygonTotalGas, setPolygonTotalGas] = useState(0);
    const [maticToUsdPrice, setMaticToUsdPrice] = useState(0);
    const [polygonRequestTotal, setPolygonRequestTotal] = useState(0);

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
        total: polygonRequestTotal,
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
    
      useEffect(() => {
        const queryTxDetails = new Moralis.Query("TxDetails");
        queryTxDetails.limit(124);
        let ourTxDetails = new Map();
        queryTxDetails.find()
        .then(result => {
          for (let i = 0; i < result.length; i++) {
            const eachResult = result[i];
            ourTxDetails.set(eachResult.get("txId"), eachResult)
          }
          setOurLocalMoralisTxDetails(ourTxDetails)
          console.log("ourTxDetails ", ourTxDetails)
        })
        .catch(err => console.log(err))
      }, [])
    
      useEffect(() => {    
        fetchPolygonTransactions(token, pageSize, offset)
        .then((jsonRes) => {
          //setPolygonTransactionsState(maticTxs);
          getTransactionsPolygon(jsonRes)
          setPolygonRequestTotal(jsonRes.total)
        })
        .catch((error) => console.error("App =>", error));
        }, [currentPage, pageSize, offset, token]);
    
    
        const getTransactionsPolygon = async (jsonRes) => {
            const polygonTransactions = [];
            let polygonGas = new BN(0);

            const optionsWrappedMatic = {
              address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
              chain: "polygon",
            };
            const priceMatic = await Moralis.Web3API.token.getTokenPrice(
              optionsWrappedMatic
            );
            const maticUsd = priceMatic.usdPrice;
            setMaticToUsdPrice(maticUsd);
        
             jsonRes.result.forEach((transaction, index) => {
              const gasUsed = ethers.utils.formatEther(
                ethers.utils.parseUnits(transaction.receipt_gas_used.toString(), "gwei"),
                { pad: true }
              );
              polygonTransactions.push(
                <Tr key={index}>
                  <Td>
                    <Link
                      href={`https://polygonscan.com/tx/${transaction.hash}`}
                      isExternal
                    >
                      {transaction.block_timestamp}
                    </Link>
                  </Td>
                  <Td>
                  <Editable
                    defaultValue={
                      ourLocalMoralisTxDetails.get(transaction.hash) !== undefined
                        ? ourLocalMoralisTxDetails.get(transaction.hash).attributes.description
                        : "edit"
                    }
                  >
                    <EditablePreview />
                    <EditableInput
                      onBlur={async (e) => {
                        await updateInMoralis(transaction.hash, e.target.value);
                        const newMap = ourLocalMoralisTxDetails;
                        newMap.set(transaction.hash, e.target.value);
                        setOurLocalMoralisTxDetails(newMap);
                      }}
                    />
                  </Editable>
                  </Td>
                  <Td>{transaction.from_address}</Td>
                  <Td>{transaction.to_address}</Td>
                  <Td isNumeric>{gasUsed}</Td>
                  <Td isNumeric>{gasUsed * maticUsd}</Td>
                  <Td isNumeric>
                    {ethers.utils.formatEther(transaction.value.toString(), {
                      pad: true,
                    })}
                  </Td>
                  <Td isNumeric>
                    {ethers.utils.formatEther(transaction.value.toString(), {
                      pad: true,
                    }) * maticUsd}
                  </Td>
                </Tr>
              );
              polygonGas = new BN(polygonGas).add(new BN(transaction.receipt_gas_used));
            });
        
            setPolygonTotalGas(polygonGas.toString(10));
            setPolygonTransactionsRows(polygonTransactions);
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
        bg: "purple.400"
      }}
      bg="purple.300"
      onClick={() =>
        console.log(
          "Im executing my own function along with Previous component functionality"
        )
      }
      >Previous</PaginationPrevious>
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
          }>

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
          bg: "green.300"
        }}
        _current={{
          bg: "green.300",
          fontSize: "sm",
          w: 7
        }}
        />
      ))}

      </PaginationPageGroup>
      <PaginationNext
      _hover={{
        bg: "purple.400"
      }}
      bg="purple.300"
      onClick={() =>
        console.log(
          "Im executing my own function along with Next component functionality"
        )
      }
      >Next</PaginationNext>
    </PaginationContainer>
  </Pagination>


  <Heading size="md" align="center" fontSize="40px" pt={2}>
    Polygon Transactions
  </Heading>
  <InputGroup size="md" m={2}>
    <Input
      pr="4.5rem"
      defaultValue={token}
      onChange={(e) => setToken(e.target.value)}
      placeholder="Enter token address"
    />
  </InputGroup>
  {/* <Button
    colorScheme="purple"
    variant="outline"
    m={2}
    onClick={}
  >
    Show all transactions
  </Button> */}
  <br></br>
  <br></br>
        <p m={2} pl="30%">current price (MATIC-USD): {maticToUsdPrice}</p>
        <br></br>
        <br></br>
        <Table variant="striped" colorScheme="blackAlpha" size="sm">
        <TableCaption>Polygon account transactions</TableCaption>
        <Thead pt={2}>
          <Tr>
            <Th>Transaction timestamp</Th>
            <Th>Description</Th>
            <Th>From Address</Th>
            <Th>To Address</Th>
            <Th isNumeric>Gas used (MATIC)</Th>
            <Th isNumeric>Gas used (USD)</Th>
            <Th isNumeric>Value (MATIC)</Th>
            <Th isNumeric>Value (USD)</Th>
          </Tr>
        </Thead>
        <Tbody>{polygonTransactionsRows.length > 0 ? polygonTransactionsRows : null}</Tbody>
        <Tfoot>
          <Tr>
            <Th>Total Gas:</Th>
            <Th isNumeric>Gas:{ethers.utils.formatEther(polygonTotalGas,{pad:true})}</Th>
            </Tr>
          </Tfoot>
      </Table>
      <br></br>
    </div>
)
}
export default PolygonTransactions