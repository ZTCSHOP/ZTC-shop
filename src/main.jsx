import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// PWA : enregistre le service worker (prod uniquement)
if('serviceWorker' in navigator && import.meta.env.PROD){
  window.addEventListener('load', ()=>{
    const base = import.meta.env.BASE_URL || '/'
    navigator.serviceWorker.register(base + 'sw.js').catch(()=>{})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
