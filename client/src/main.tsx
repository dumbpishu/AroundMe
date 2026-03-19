import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { appRouter } from './routes/appRouter.tsx'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={appRouter} />
    </AuthProvider>
  </StrictMode>,
)
