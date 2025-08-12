// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';           // ← now resolves to the new root App.js
import './index.css';
import reportWebVitals from './reportWebVitals';
import { WalletProvider } from './contexts/WalletContext';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
     <WalletProvider>
        <App />
     </WalletProvider>
  
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
