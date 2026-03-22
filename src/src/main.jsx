import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'

// Detect basename dynamically for HA ingress access
const ingressMatch = window.location.pathname.match(/^(\/api\/hassio_ingress\/[^/]+)/);
const basename = ingressMatch ? ingressMatch[1] : '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
