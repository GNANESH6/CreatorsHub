import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, UserCircle, Search, Users, LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the navbar on login and register pages
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
    return null; 
  }

  return (
    <div style={{ padding: '1rem', width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      

      {/* Global Quick Actions Navbar */}
      <div className="glass-panel" style={{ background: 'rgba(236, 72, 153, 0.1)', borderColor: 'rgba(236, 72, 153, 0.3)', padding: '1rem' }}>
        <h3 style={{ margin: 0, marginBottom: '1rem', color: '#ec4899' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ flex: 1, minWidth: '150px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)' }}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => navigate('/setup-profile')} className="btn-primary" style={{ flex: 1, minWidth: '150px' }}>
            <UserCircle size={18} /> Complete Profile
          </button>
          <button onClick={() => navigate('/discover')} className="btn-primary" style={{ flex: 1, minWidth: '150px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Search size={18} /> Discover Creators
          </button>
          <button onClick={() => navigate('/collaborations')} className="btn-primary" style={{ flex: 1, minWidth: '150px', background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
            <Users size={18} /> My Collaborations
          </button>
          <button onClick={() => { sessionStorage.clear(); navigate('/login'); }} className="btn-primary" style={{ flex: 1, minWidth: '150px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

    </div>
  );
};

export default Navbar;
