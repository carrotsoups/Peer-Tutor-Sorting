import {
  DrivePicker,
  DrivePickerDocsView,
} from "@googleworkspace/drive-picker-react"

import { useAuth } from "../components/AuthContext"
import { useSheet } from "../context/SheetContext"
import { useNavigate } from "react-router-dom"



const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID

const GoogleDrivePicker = () => {
  const { user } = useAuth()
  const { setRows } = useSheet()
  const navigate = useNavigate()

  const handlePicked = async (e) => {
    const file = e.detail.docs[0]
    const accessToken = user?.accessToken

    console.log("Picked file:", file)
    console.log("Token scopes (debug):", e.detail.oauthScope)
    console.log("Access token:", e.detail.oauthToken)
    console.log("Full event:", e.detail)

    // Step 1: If it's a Form, find linked spreadsheet
    let spreadsheetId = null

    if (file.mimeType === "application/vnd.google-apps.form") {
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${file.id}?fields=linkedContent`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      const driveData = await driveRes.json()

      // Extract spreadsheet ID from linked content URL
      if (driveData.linkedContent?.uri) {
        const match = driveData.linkedContent.uri.match(/[-\w]{25,}/)
        spreadsheetId = match ? match[0] : null
      }
    }

    // If user picked a spreadsheet directly
    if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
      spreadsheetId = file.id
    }

    if (!spreadsheetId) {
      alert("No linked response spreadsheet found.")
      return
    }

    // Step 2: Get sheet metadata (to detect sheet name)
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const metaData = await metaRes.json()
    console.log("metaData:", metaData)
    if (!metaData.sheets) {
      console.error("Sheet metadata failed:", metaData)
      alert("Failed to load sheet metadata")
      return
    }
    const firstSheetName = metaData.sheets[0].properties.title

    // Step 3: Get sheet values
    const sheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${firstSheetName}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    const sheetData = await sheetRes.json()

    console.log("Sheet rows:", sheetData.values)

    setRows(sheetData.values || [])
    
    // Navigate to scheduling page after successful data load
    navigate('/schedule')
  }

  return (
    <div>
      <DrivePicker
        client-id={CLIENT_ID}
        app-id={APP_ID}
        oauth-token={user?.accessToken}
        onPicked={handlePicked}
        onCanceled={() => console.log("Picker cancelled")}
        onOAuthError={(err) => console.error("OAuth Error:", err)}
      >
        <button type="button">Select Form or Sheet</button>
        <DrivePickerDocsView
          mimeTypes="application/vnd.google-apps.spreadsheet"
        />
      </DrivePicker>
    </div>
  )
}

export default GoogleDrivePicker