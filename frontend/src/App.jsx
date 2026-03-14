import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import Discover from './pages/Discover';
import UserProfile from './pages/UserProfile';
import Collaborations from './pages/Collaborations';
import Messages from './pages/Messages';
import Navbar from './components/Navbar';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/setup-profile" element={<ProfileSetup />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/collaborations" element={<Collaborations />} />
            <Route path="/messages/:id" element={<Messages />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
