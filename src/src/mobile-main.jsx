import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import MobileApp from './MobileApp.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'

// Detect basename dynamically: /mobile for direct access,
// /api/hassio_ingress/<token>/mobile for HA ingress access
const path = window.location.pathname;
const mobileIdx = path.indexOf('/mobile');
const basename = mobileIdx >= 0 ? path.substring(0, mobileIdx + '/mobile'.length) : '/mobile';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <MobileApp />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
