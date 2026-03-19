import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, MapPin, Briefcase } from 'lucide-react';

const Discover = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Basic search fetching without geo initially for broad results
  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Run empty search on mount to show default profiles
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="perspective-container" style={{ width: '100%', maxWidth: '1000px', margin: '2rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="heading-gradient animate-fade-up" style={{ fontSize: '3rem' }}>
          Discover Creators
        </h1>
        <p className="animate-fade-up delay-100" style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Find the perfect collaborator based on occupation and skills.
        </p>
      </div>

      <form onSubmit={handleSearch} className="animate-fade-up delay-200" style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '3rem', fontSize: '1.2rem' }}
            placeholder="Search by occupation, Name, Location ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {results.map((user, idx) => (
          <div key={user._id} className="glass-panel tilt-3d animate-fade-up" style={{ animationDelay: `${(idx % 5) * 100}ms`, cursor: 'pointer' }} onClick={() => navigate(`/profile/${user._id}`)}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <img src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundType=gradientLinear`} alt={user.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{user.name}</h3>
                <span style={{ color: 'var(--secondary)', fontWeight: 'bold', fontSize: '0.9rem' }}>{user.occupation}</span>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {user.bio}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {user.skills?.slice(0, 3).map(skill => (
                <span key={skill} style={{ background: 'rgba(109, 40, 217, 0.2)', color: '#c4b5fd', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                  {skill}
                </span>
              ))}
              {user.skills?.length > 3 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+{user.skills.length - 3} more</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <MapPin size={16} /> {user.locationName}
            </div>
          </div>
        ))}
        {!loading && results.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
            No creators found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
