import { Routes, Route } from "react-router-dom";
import { Landing } from "../pages/Landing";
import { Home } from "../pages/Home";
import { Schedule } from "../pages/Schedule";
import { NotifyMatches } from "../pages/NotifyMatches";
import { PrivacyPolicy } from "../pages/PrivacyPolicy";
import { Navbar } from "./Navbar";
import { AuthProvider } from "./AuthContext";
import { SheetProvider } from "../context/SheetContext";

function App() {
  return (
    <AuthProvider>
      <SheetProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing/>} />
          <Route path="/home" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/notify-matches" element={<NotifyMatches />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
      </SheetProvider>
    </AuthProvider>
  );
}

export default App;
