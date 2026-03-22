import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />

    {/* Global Toaster for notifications */}
    <Toaster position="top-right" toastOptions={{
      style: {
        borderRadius: '8px',
        background: '#333',
        color: '#fff',
      },
      duration: 3000,
    }} />
  </StrictMode>,
)
