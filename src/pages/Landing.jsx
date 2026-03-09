import { GoogleLogin, GoogleOAuthProvider, googleLogout,useGoogleLogin} from "@react-oauth/google"
import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../components/AuthContext";
import { useSheet } from "../context/SheetContext";
import { useState } from "react";
import { parseSpreadsheetText } from "../utils/processing";
import '../css/App.css'

export function Landing(){
    const navigate = useNavigate()
    const { login } = useAuth()
    const { setRows } = useSheet();

    const [mode, setMode] = useState("choose"); // "choose" | "manual"
    const [manualText, setManualText] = useState("");
    const [previewRows, setPreviewRows] = useState([]);

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

    const handlePreview = () => {
      const rows = parseSpreadsheetText(manualText);
      setPreviewRows(rows);
    };

    const handleConfirm = () => {
      if (previewRows.length === 0) return;
      setRows(previewRows);
      navigate("/schedule");
    };

    // render preview table if available
    const previewTable = previewRows.length > 0 && (
      <div style={{ marginTop: '1rem' }}>
        <h3>Preview</h3>
        <table border="1" cellPadding="5">
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={handleConfirm} style={{ marginTop: '1rem' }}>
          Confirm and Schedule
        </button>
      </div>
    );

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

          {mode === 'choose' && (
            <div className="features-list">
              <h3>How would you like to provide data?</h3>
              <button onClick={() => googleLogin()} className="google-login-btn">
                Connect with Google Drive
              </button>
              <button
                onClick={() => {
                  setMode('manual');
                  setManualText('');
                  setPreviewRows([]);
                }}
                style={{ marginLeft: '1rem' }}
              >
                Paste Spreadsheet Manually
              </button>
            </div>
          )}

          {mode === 'manual' && (
            <div style={{ marginTop: '2rem' }}>
              <h3>Paste your sheet data</h3>
              <p>Copy a range from Google Sheets or a CSV file and paste below (tabs or commas).</p>
              <textarea
                rows={10}
                cols={60}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
              <div style={{ marginTop: '0.5rem' }}>
                <button onClick={handlePreview}>Preview</button>
                <button onClick={() => {
                    setMode('choose');
                    setManualText('');
                    setPreviewRows([]);
                  }} style={{ marginLeft: '1rem' }}>
                  Back
                </button>
              </div>
              {previewTable}
            </div>
          )}
        </div>
      </div>
    )
}
