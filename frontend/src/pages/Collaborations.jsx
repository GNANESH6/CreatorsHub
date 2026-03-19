import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, X, MessageSquare } from 'lucide-react';

const Collaborations = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAllData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return navigate('/login');
      
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [resIncoming, resOutgoing, resConnections] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/collaboration/incoming`, config),
        axios.get(`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/collaboration/outgoing`, config),
        axios.get(`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/collaboration/connections`, config)
      ]);

      setIncoming(resIncoming.data);
      setOutgoing(resOutgoing.data);
      setConnections(resConnections.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const respondRequest = async (collabId, status) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/collaboration/${collabId}`, {
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // refresh lists
      fetchAllData();
      alert(`Request ${status}ed successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to respond');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading collaborations...</div>;

  return (
    <div style={{ width: '100%', maxWidth: '1000px', margin: '2rem auto' }} className="animate-fade-up">
      <h1 className="heading-gradient" style={{ fontSize: '3rem', marginBottom: '2rem', textAlign: 'center', width: '100%' }}>
        Collaborations
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Incoming Requests */}
        <div className="glass-panel">
          <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Received Requests</h3>
          {incoming.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No new requests received.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {incoming.map(req => (
                <div key={req._id} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <img src={req.sender?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${req.sender?.name || 'User'}&backgroundType=gradientLinear`} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: 'white', display: 'block' }}>{req.sender?.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{req.sender?.occupation}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => respondRequest(req._id, 'accepted')} className="btn-primary" style={{ flex: 1, padding: '0.6rem', background: 'var(--secondary)' }}><Check size={16} /> Accept</button>
                    <button onClick={() => respondRequest(req._id, 'rejected')} className="btn-primary" style={{ flex: 1, padding: '0.6rem', background: 'var(--danger)', border: 'none' }}><X size={16} /> Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outgoing Requests */}
        <div className="glass-panel">
          <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Sent Requests</h3>
          {outgoing.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No pending sent requests.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {outgoing.map(req => (
                <div key={req._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img src={req.receiver?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${req.receiver?.name || 'User'}&backgroundType=gradientLinear`} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block' }}>{req.receiver?.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending approval</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accepted Connections */}
        <div className="glass-panel">
          <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>Active Connections</h3>
          {connections.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No active collaborations yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {connections.map(req => {
                const other = req.sender?._id !== sessionStorage.getItem('userId') ? req.sender : req.receiver;
                return (
                  <div key={req._id} style={{ background: 'rgba(109, 40, 217, 0.1)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img src={other?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${other?.name || 'User'}&backgroundType=gradientLinear`} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                      <div>
                        <strong style={{ color: '#c4b5fd', display: 'block' }}>{other?.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{other?.occupation}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/messages/${other?._id}`)} 
                      className="btn-primary" 
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        padding: '0', 
                        borderRadius: '12px',
                        flexShrink: 0,
                        background: 'rgba(109, 40, 217, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        boxShadow: 'none'
                      }} 
                      title="Start Chat"
                    >
                      <MessageSquare size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Collaborations;
