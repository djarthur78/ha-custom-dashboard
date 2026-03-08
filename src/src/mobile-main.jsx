import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import MobileApp from './MobileApp.jsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/mobile">
        <MobileApp />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
