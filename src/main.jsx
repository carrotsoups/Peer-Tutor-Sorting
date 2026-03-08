import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'
import App from './components/App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const basename =
  import.meta.env.MODE === "production"
    ? "/Peer-Tutor-Sorting"
    : "/"

createRoot(document.getElementById("root")).render(
    <BrowserRouter basename={basename}>
      
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
    </BrowserRouter>
);