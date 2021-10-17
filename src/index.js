import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Landing from './pages/Landing';
import reportWebVitals from './reportWebVitals';
import { MoralisProvider } from "react-moralis";
import { ChakraProvider } from "@chakra-ui/react"
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

const APP_ID =`${process.env.REACT_APP_APP_ID}`
const SERVER_URL =`${process.env.REACT_APP_SERVER_URL}`

ReactDOM.render(
  <React.StrictMode>
  <ChakraProvider>
  <MoralisProvider appId={APP_ID} serverUrl={SERVER_URL}>
  <Router>
  <Switch>
  <Route exact path="/" children={<Landing />} />
  <Route exact path="/cryptoAccountStatement" children={<App />} />
  </Switch>
  </Router>
  </MoralisProvider>
  </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
