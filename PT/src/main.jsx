import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './components/App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
const CLIENT_ID = "1042549290884-m4lrm8tpcm1hj8gvn27jtmmglmopjhlh.apps.googleusercontent.com"

createRoot(document.getElementById("root")).render(
    <BrowserRouter>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    
    </GoogleOAuthProvider>
    </BrowserRouter>
);