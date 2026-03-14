import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, UserPlus, MapPin, Briefcase, Check, X, MessageSquare, Video, FileText, Image } from 'lucide-react';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collabStatus, setCollabStatus] = useState(null); // 'none', 'pending', 'accepted'
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setUser(null);
      setReviews([]);
      setPortfolio([]);
      setCollabStatus(null);
      
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return navigate('/login');

        const resUser = await axios.get(`http://localhost:5002/api/users/search?q=`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const foundUser = resUser.data.find(u => u._id === id);
        
        if (foundUser) {
          setUser(foundUser);
        } else {
          const meRes = await axios.get('http://localhost:5002/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (meRes.data._id === id) {
             setUser(meRes.data);
          }
        }

        const resRev = await axios.get(`http://localhost:5002/api/reviews/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReviews(resRev.data);

        const resPort = await axios.get(`http://localhost:5002/api/portfolio/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPortfolio(resPort.data);

        const [resConn, resInc, resOut] = await Promise.all([
          axios.get('http://localhost:5002/api/collaboration/connections', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5002/api/collaboration/incoming', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:5002/api/collaboration/outgoing', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (resConn.data.some(c => c.sender._id === id || c.receiver._id === id)) {
          setCollabStatus('accepted');
        } else if (resInc.data.some(c => c.sender._id === id)) {
          setCollabStatus('incoming_pending');
          const collab = resInc.data.find(c => c.sender._id === id);
          setPendingCollabId(collab._id);
        } else if (resOut.data.some(c => c.receiver._id === id)) {
          setCollabStatus('pending');
        } else {
          setCollabStatus('none');
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const [pendingCollabId, setPendingCollabId] = useState(null);

  const handleRespond = async (status) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`http://localhost:5002/api/collaboration/${pendingCollabId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Request ${status}ed!`);
      window.location.reload();
    } catch (err) {
      alert('Failed to respond');
    }
  };

  const handleRequestCollab = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post('http://localhost:5002/api/collaboration/send', { receiverId: id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCollabStatus('pending');
      alert("Collaboration request sent!");
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post('http://localhost:5002/api/reviews', {
        revieweeId: id,
        rating,
        comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews([res.data, ...reviews]);
      setComment('');
      setReviewMsg('Review added successfully!');
    } catch (err) {
      setReviewMsg(err.response?.data?.message || 'Failed to add review');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading profile...</div>;
  if (!user) return <div style={{ textAlign: 'center', marginTop: '5rem' }}>User not found.</div>;

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '2rem auto' }} className="animate-fade-up">
      {/* Profile Header Block */}
      <div className="glass-panel" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <img src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundType=gradientLinear`} alt={user.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }} />
        <div style={{ flex: 1 }}>
          <h1 className="heading-gradient" style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem' }}>{user.name}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
            <Briefcase size={18} /> {user.occupation}
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
            <MapPin size={18} /> {user.locationName}
          </p>
          <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>{user.bio}</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {user.skills?.map(skill => (
              <span key={skill} style={{ background: 'rgba(109, 40, 217, 0.2)', color: '#c4b5fd', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                {skill}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {collabStatus === 'none' && (
              <button onClick={handleRequestCollab} className="btn-primary" style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
                <UserPlus size={18} /> Send Collab Request
              </button>
            )}
            {collabStatus === 'pending' && (
              <button disabled className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)', cursor: 'not-allowed' }}>
                <Check size={18} /> Request Sent (Pending)
              </button>
            )}
            {collabStatus === 'incoming_pending' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleRespond('accepted')} className="btn-primary" style={{ flex: 1, background: 'var(--secondary)' }}>
                  <Check size={18} /> Accept
                </button>
                <button onClick={() => handleRespond('rejected')} className="btn-primary" style={{ flex: 1, background: 'var(--danger)', border: 'none' }}>
                  <X size={18} /> Reject
                </button>
              </div>
            )}
            {collabStatus === 'accepted' && (
              <button onClick={() => navigate(`/messages/${id}`)} className="btn-primary" style={{ background: 'var(--primary)' }}>
                <MessageSquare size={18} /> Message Creator
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Section */}
      <h2 className="heading-gradient" style={{ marginBottom: '1rem' }}>Portfolio Highlights</h2>
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
        {portfolio.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No portfolio items uploaded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
          {portfolio.map(item => (
            <div key={item._id} className="animate-fade-up" style={{ 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'var(--secondary)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ height: '160px', width: '100%', position: 'relative', background: '#000' }}>
                {item.fileType === 'video' ? (
                  <video src={item.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => {e.target.pause(); e.target.currentTime = 0; }} />
                ) : item.fileType === 'image' ? (
                  <img src={item.fileUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--primary)' }}>
                    <FileText size={48} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', color: 'white', backdropFilter: 'blur(4px)' }}>
                   {item.fileType.toUpperCase()}
                </div>
              </div>
              <div style={{ padding: '1.2rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                <a href={item.fileUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '0.6rem', fontSize: '0.85rem', width: '100%', textAlign: 'center', display: 'block', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--surface-border)', color: 'var(--text-main)' }}>
                   Open Full View
                </a>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Reviews Section */}
      <h2 className="heading-gradient" style={{ marginBottom: '1rem' }}>Reviews & Ratings</h2>
      <div className="glass-panel">
        
        {/* Post Review Form */}
        <form onSubmit={handleSubmitReview} style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--surface-border)' }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Leave a Review</h4>
          {reviewMsg && <div style={{ color: reviewMsg.includes('success') ? 'var(--secondary)' : 'var(--danger)', marginBottom: '1rem' }}>{reviewMsg}</div>}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <input type="number" min="1" max="5" value={rating} onChange={e => setRating(e.target.value)} className="form-input" placeholder="Rating (1-5)" required />
            </div>
            <div style={{ flex: 3 }}>
              <input type="text" value={comment} onChange={e => setComment(e.target.value)} className="form-input" placeholder="Your feedback..." required />
            </div>
          </div>
          <button type="submit" className="btn-primary"><Star size={18} /> Submit Review</button>
        </form>

        {reviews.length === 0 ? <p style={{ color: 'var(--text-muted)', margin: 0 }}>No reviews yet.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map(r => (
              <div key={r._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{r.reviewerId?.name || 'Anonymous'}</span>
                  <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Star size={14} fill="#fbbf24" /> {r.rating}/5</span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem' }}>"{r.comment}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
