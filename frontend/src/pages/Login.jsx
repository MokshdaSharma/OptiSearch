import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '1.5rem' 
          }}>
            <FileText size={64} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Welcome to OptiSearch
          </h1>
          <p style={{ color: 'var(--white)', fontSize: '1.125rem' }}>
            Sign in to access your documents
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem', 
              fontSize: '1.125rem', 
              fontWeight: '600',
              color: 'var(--text)'
            }}>Email</label>
            <input
              type="email"
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ fontSize: '1.125rem', padding: '1rem 1.25rem' }}
            />
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem', 
              fontSize: '1.125rem', 
              fontWeight: '600',
              color: 'var(--text)'
            }}>Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ fontSize: '1.125rem', padding: '1rem 1.25rem' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ 
              padding: '1rem 1.5rem', 
              fontSize: '1.125rem',
              fontWeight: '600',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} />
            ) : (
              <>
                <LogIn size={22} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ 
          marginTop: '2.5rem', 
          textAlign: 'center',
          fontSize: '1.125rem',
          paddingTop: '2rem',
          borderTop: '1px solid var(--border)'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account?</span>{' '}
          <Link 
            to="/register" 
            style={{ 
              color: 'var(--primary)', 
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
