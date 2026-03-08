import { Routes, Route } from "react-router-dom";
import { Landing } from "../pages/Landing";
import { Home } from "../pages/Home";
import { Schedule } from "../pages/Schedule";
import { Navbar } from "./Navbar";
import { AuthProvider } from "./AuthContext";
import { SheetProvider } from "../context/SheetContext";

function App() {
  console.log("CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID)
  console.log("ALL ENV:", import.meta.env)
  return (
    <AuthProvider>
      <SheetProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/home" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
        </Routes>
      </SheetProvider>
    </AuthProvider>
  );
}

export default App;
