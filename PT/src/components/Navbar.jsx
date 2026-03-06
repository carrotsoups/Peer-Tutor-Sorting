import { useNavigate } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';
import { useAuth } from './AuthContext';
import '../css/Navbar.css';

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    googleLogout();
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1 onClick={() => navigate('/')}>Peer Tutor Sorting</h1>
        </div>
        <div className="navbar-menu">
          {user ? (
            <>
              <span className="navbar-user">Welcome, {user.name || user.email}!</span>
              <button onClick={handleLogout} className="navbar-button logout-btn">
                Logout
              </button>
            </>
          ) : (
            <span className="navbar-login-prompt">Please log in</span>
          )}
        </div>
      </div>
    </nav>
  );
}
