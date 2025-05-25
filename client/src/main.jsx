import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'; // Import the new global styles
import './index.css' // Keep your existing index.css for now
import './styles/AdminCommon.css'; // Import common admin styles
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
