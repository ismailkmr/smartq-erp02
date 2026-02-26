import { useState, useEffect } from 'react'
import Login from './components/Login'
import './App.css'

interface User {
  uid: string;
  email: string;
  displayName: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [checkingAuth, setCheckingAuth] = useState(true); // track initial auth check

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }

    // done checking regardless
    setCheckingAuth(false);
  }, []);

  const handleLoginSuccess = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setToken('');
  };

  // while we are determining whether a stored login exists display a loader to
  // prevent the login form from flashing briefly before the check completes
  if (checkingAuth) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>SmartQ ERP</h1>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="welcome-card">
          <h2>Welcome, {user?.displayName || user?.email}!</h2>
          <p>You are successfully logged in to SmartQ ERP</p>
          <div className="user-details">
            <p><strong>UID:</strong> {user?.uid}</p>
            <p><strong>Email:</strong> {user?.email}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

