import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Search, Upload, FileText, Activity, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ 
      background: 'var(--white)', 
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    }}>
      <div className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: '4.5rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <Link to="/dashboard" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          textDecoration: 'none',
          color: 'var(--primary)',
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          <FileText size={32} />
          <span>OptiSearch</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/dashboard" className="btn btn-outline btn-sm">
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link to="/upload" className="btn btn-outline btn-sm">
            <Upload size={16} />
            Upload
          </Link>
          <Link to="/search" className="btn btn-outline btn-sm">
            <Search size={16} />
            Search
          </Link>
          <Link to="/documents" className="btn btn-outline btn-sm">
            <FileText size={16} />
            Documents
          </Link>
          <Link to="/jobs" className="btn btn-outline btn-sm">
            <Activity size={16} />
            Jobs
          </Link>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginLeft: '1rem',
            paddingLeft: '1rem',
            borderLeft: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>
              {user?.username}
            </span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
