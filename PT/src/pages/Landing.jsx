import { GoogleLogin, GoogleOAuthProvider, googleLogout,useGoogleLogin} from "@react-oauth/google"
import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../components/AuthContext";
import '../css/App.css'



export function Landing(){
    const navigate = useNavigate()
    const { login } = useAuth()
    const googleLogin = useGoogleLogin({
  scope:
    "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly",
  flow: "implicit",
  onSuccess: (tokenResponse) => {
    console.log("Access Token:", tokenResponse.access_token)
    navigate("/home")

    login({
      accessToken: tokenResponse.access_token
    })
  },
})
    
    return (
        <>
                    <button onClick={() => googleLogin()}>
                Connect Google Drive
            </button>
        </>
    )
}
