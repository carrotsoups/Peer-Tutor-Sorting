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
        <div className="landing-container">
            <div className="landing-content">
                <h1>Peer Tutor Sorting</h1>
                <p className="app-description">
                    Streamline peer tutoring programs with intelligent scheduling. Our application helps educational institutions
                    efficiently match tutors with students based on availability, grade levels, and scheduling preferences.
                    Upload your Google Sheets data and use our drag-and-drop interface to create optimal tutoring schedules,
                    or let our auto-scheduling algorithm handle the pairing automatically while respecting all constraints.
                </p>
                <div className="features-list">
                    <h3>Key Features:</h3>
                    <ul>
                        <li>Google Sheets integration for easy data import</li>
                        <li>Drag-and-drop scheduling interface</li>
                        <li>Intelligent auto-scheduling algorithm</li>
                        <li>Grade-based compatibility matching</li>
                        <li>Time-specific availability tracking</li>
                        <li>Conflict detection and resolution</li>
                    </ul>
                </div>
                <button onClick={() => googleLogin()} className="google-login-btn">
                    Connect with Google Drive
                </button>
            </div>
        </div>
    )
}
