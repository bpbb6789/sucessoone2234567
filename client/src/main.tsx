import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure MetaMask is properly detected before rendering
const initializeApp = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Give MetaMask time to inject if it's installed
    const timeout = setTimeout(() => {
      ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      )
    }, 100)

    // If ethereum is already available, render immediately
    if (window.ethereum) {
      clearTimeout(timeout)
      ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      )
    }
  } else {
    // Server-side rendering fallback
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  }
}

initializeApp()