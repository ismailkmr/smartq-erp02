import { useState, FormEvent, ChangeEvent } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import '../styles/Login.css';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const loginWithAPI = async (idToken: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API login failed';
      setError(errorMessage);
      throw err;
    }
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userCredential;

      if (isSignUp) {
        // Create new account
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Sign in
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      // Get ID token
      const idToken = await userCredential.user.getIdToken();

      // Login with your API
      await loginWithAPI(idToken);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>{isSignUp ? 'Sign Up' : 'Login'}</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="toggle-auth">
          <p>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="toggle-button"
              disabled={loading}
            >
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
