import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, User, UserCircle } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const handleMouseMove = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = ((clientX - left) / width - 0.5) * 40; // Max 20deg tilt
    const y = ((clientY - top) / height - 0.5) * -40;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUserData(res.data);
      } catch (err) {
        sessionStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)' }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="perspective-container" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', paddingTop: '2rem' }}>
      {/* God-Tier Cinematic 3D Navbar */}
      <div 
        className="magnetic-wrap"
        onMouseMove={handleMouseMove} 
        onMouseEnter={() => {}}
        onMouseOver={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          transform: `perspective(1200px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          marginBottom: '5rem'
        }}
      >
        <nav className="tilt-3d glass-shimmer animate-assemble-bg neon-edge-trace" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '0.8rem 2.5rem', 
          background: 'rgba(2, 6, 23, 0.4)', 
          borderRadius: '100px', 
          backdropFilter: 'blur(30px)',
          maxWidth: 'fit-content',
          transformStyle: 'preserve-3d',
          position: 'relative'
        }}>
          {/* Aura Orbs */}
          <div className="aura-orb" style={{ top: '-40%', left: '-10%', transform: `translate(${tilt.x * 2}px, ${tilt.y * 2}px)` }} />
          <div className="aura-orb" style={{ bottom: '-40%', right: '-10%', transform: `translate(${-tilt.x * 2}px, ${-tilt.y * 2}px)`, background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', transformStyle: 'preserve-3d' }}>
            <div className="animate-assemble-icon" style={{ 
              background: 'rgba(255,255,255,0.03)', 
              padding: '0.7rem', 
              borderRadius: '50%', 
              display: 'flex',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: 'inset 0 0 15px rgba(255,255,255,0.1)',
              transformStyle: 'preserve-3d',
              transform: 'translateZ(60px)'
            }}>
              <LayoutDashboard className="icon-3d" color="#f8fafc" size={20} />
            </div>
            <h2 className="animate-assemble-text" style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: '900', 
              letterSpacing: '-1px',
              color: 'white',
              textShadow: '0 0 40px rgba(255,255,255,0.4)',
              transform: 'translateZ(40px)'
            }}>
              CreatorsHub
            </h2>
          </div>
        </nav>
      </div>

      {/* Hero Section: World-Class Minimalist */}
      <div style={{ 
        position: 'relative', 
        height: '380px', 
        borderRadius: '32px', 
        overflow: 'hidden', 
        marginBottom: '4rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.03)'
      }} className="animate-fade-up">
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1600" 
          alt="Creative Team" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} 
        />
        <div className="float-3d" style={{ 
          position: 'absolute', 
          inset: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          padding: '0 4rem', 
          background: 'linear-gradient(to right, rgba(2, 6, 23, 0.9), transparent)',
          transformStyle: 'preserve-3d'
        }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            margin: '0 0 1rem 0', 
            fontWeight: '900', 
            letterSpacing: '-2px', 
            color: 'white' 
          }}>
            CreatorsHub
          </h1>
          <p style={{ 
            color: 'rgba(148, 163, 184, 0.9)', 
            fontSize: '1.25rem', 
            margin: 0, 
            maxWidth: '500px', 
            lineHeight: '1.6',
            fontWeight: '400' 
          }}>
            Building the future of creative collaboration. Your next masterpiece begins with a single connection.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
        {/* Identity & Welcome: Cleanest Possible */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="glass-panel tilt-3d" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'white', fontWeight: '700' }}>
              Welcome back, {userData?.name}
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: '0 auto', maxWidth: '400px' }}>
              Your workspace is ready. Let's create something extraordinary today.
            </p>
          </div>

          <div className="glass-panel tilt-3d" style={{ padding: '3rem', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <User size={20} color="#94a3b8" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'white', fontWeight: '600' }}>Profile Overview</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {[
                { label: 'Display Name', value: userData?.name },
                { label: 'Account Email', value: userData?.email },
                { label: 'Join Date', value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'N/A' }
              ].map((row, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.01)' }}>
                  <span style={{ color: '#64748b', fontSize: '0.95rem' }}>{row.label}</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/setup-profile')} className="btn-primary" style={{ marginTop: '3rem', width: '100%', padding: '1.2rem', borderRadius: '16px', fontWeight: '600', letterSpacing: '0.5px' }}>
              <UserCircle size={18} /> Manage Creative Identity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
