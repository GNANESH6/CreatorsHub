import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import imageCompression from 'browser-image-compression';
import { Send, ArrowLeft, MoreVertical, Phone, Check, CheckCheck, Mic, Paperclip, Camera, X } from 'lucide-react';

const Messages = () => {
  const { id } = useParams(); // The ID of the user we want to chat with
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [callState, setCallState] = useState(null); // 'calling', 'incoming', 'active'
  const [callDuration, setCallDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Typing state
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Reply State
  const [replyingTo, setReplyingTo] = useState(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [swipingId, setSwipingId] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Message Options State
  const [selectedMessage, setSelectedMessage] = useState(null);

  // WebRTC Audio Call States
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const EMOJIS = ['😊','😂','❤️','👌','👍','🫡','😓','🤯','🥵','🥳','👏','🤝','👋','👎','🤬','😤','😎','🤮','🥰'];
  
  const scrollRef = useRef();
  const socketRef = useRef();
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const ringtoneRef = useRef(null);

  // STUN Servers for WebRTC
  const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return navigate('/login');

    const initChat = async () => {
      try {
        const resUser = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/search?q=`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const foundPartner = resUser.data.find(u => u._id === id);
        if (foundPartner) {
           setPartner(foundPartner);
        } else {
           setPartner({ name: "User", _id: id });
        }

        const resConn = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/create`, { userId: id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversation(resConn.data);

        const resMsgs = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/messages/${resConn.data._id}?page=1&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(resMsgs.data);
        if (resMsgs.data.length < 50) setHasMore(false);

        if (!socketRef.current) {
          socketRef.current = io(import.meta.env.VITE_API_URL, { auth: { token } });
        }

        socketRef.current.on('onlineUsersList', (users) => setIsOnline(users.includes(id)));
        socketRef.current.on('userOnline', (userId) => { if (userId === id) setIsOnline(true); });
        socketRef.current.on('userOffline', (userId) => { if (userId === id) setIsOnline(false); });

        socketRef.current.off('receiveMessage'); 
        socketRef.current.on('receiveMessage', (msg) => {
          setMessages((prev) => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
          // Only send 'markAsSeen' back if we are the ones receiving it
          if (msg.sender === id) {
            socketRef.current.emit('markAsSeen', { messageIds: [msg._id], senderId: id });
          }
        });

        socketRef.current.on('messagesSeen', ({ messageIds }) => {
          setMessages(prev => prev.map(m => messageIds.includes(m._id) ? { ...m, seen: true } : m));
        });

        socketRef.current.on('messageDeleted', ({ messageId, deletedForEveryone }) => {
          setMessages(prev => prev.map(m => {
            if (m._id === messageId && deletedForEveryone) {
              return { ...m, deletedForEveryone: true, text: "This message was deleted", fileUrl: null, fileType: null };
            }
            return m;
          }));
        });

        // Realtime Call Listeners
        socketRef.current.on('incomingCall', ({ callerId, callerName }) => {
          if (callerId === id) {
            setCallState('incoming');
            if (ringtoneRef.current) {
               ringtoneRef.current.currentTime = 0;
               ringtoneRef.current.play().catch(e => console.error("Audio play blocked:", e));
            }
          }
        });
        socketRef.current.on('callAnswered', async () => {
          setCallState('active');
          if (peerConnectionRef.current) {
            try {
              const offer = await peerConnectionRef.current.createOffer();
              await peerConnectionRef.current.setLocalDescription(offer);
              socketRef.current.emit('webrtcOffer', { targetId: id, sdp: offer });
            } catch (err) {
              console.error("Error creating WebRTC offer:", err);
            }
          }
        });
        socketRef.current.on('callEnded', () => handleEndCallCleanup());
        socketRef.current.on('callRejected', () => handleEndCallCleanup());

        // WebRTC Signaling Listeners
        socketRef.current.on('webrtcOffer', async ({ callerId, sdp }) => {
          if (peerConnectionRef.current && callerId === id) {
            try {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
              const answer = await peerConnectionRef.current.createAnswer();
              await peerConnectionRef.current.setLocalDescription(answer);
              socketRef.current.emit('webrtcAnswer', { targetId: id, sdp: answer });
            } catch (err) {
              console.error("Error handling WebRTC offer:", err);
            }
          }
        });

        socketRef.current.on('webrtcAnswer', async ({ receiverId, sdp }) => {
          if (peerConnectionRef.current && receiverId === id) {
            try {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
            } catch (err) {
              console.error("Error setting WebRTC answer:", err);
            }
          }
        });

        socketRef.current.on('iceCandidate', async ({ senderId, candidate }) => {
          if (peerConnectionRef.current && senderId === id) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding ICE candidate:", err);
            }
          }
        });

        socketRef.current.on('typing', ({ senderId }) => {
          if (senderId === id) setIsTyping(true);
        });
        
        socketRef.current.on('stopTyping', ({ senderId }) => {
          if (senderId === id) setIsTyping(false);
        });

        const unseenIds = resMsgs.data.filter(m => m.sender === id && !m.seen).map(m => m._id);
        if (unseenIds.length > 0) {
          socketRef.current.emit('markAsSeen', { messageIds: unseenIds, senderId: id });
        }
        
        // Push Notification Setup
        await setupPushNotifications(token);

      } catch (err) {
        console.error(err);
        navigate('/collaborations');
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveMessage');
        socketRef.current.off('onlineUsersList');
        socketRef.current.off('userOnline');
        socketRef.current.off('userOffline');
        socketRef.current.off('messagesSeen');
        socketRef.current.off('incomingCall');
        socketRef.current.off('callAnswered');
        socketRef.current.off('callEnded');
        socketRef.current.off('callRejected');
        socketRef.current.off('webrtcOffer');
        socketRef.current.off('webrtcAnswer');
        socketRef.current.off('iceCandidate');
        socketRef.current.off('typing');
        socketRef.current.off('stopTyping');
        handleEndCallCleanup(); // Cleanup media tracks on unmount
      }
    };
  }, [id, navigate]);

  // Call Timer Effect
  useEffect(() => {
    let interval = null;
    if (callState === 'active') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    // Only scroll to bottom on initial load or when a new message is sent/received
    // i.e., when we haven't loaded past page 1
    if (page === 1) {
       scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, page]);

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const setupPushNotifications = async (token) => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/push/vapidKey`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(res.data.publicKey)
        });
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/api/users/push/subscribe`, { subscription }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Push setup error:", err);
    }
  };

  const handleScroll = async (e) => {
    if (e.target.scrollTop === 0 && hasMore && !isLoadingMore && conversation) {
      setIsLoadingMore(true);
      try {
        const nextPage = page + 1;
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/chat/messages/${conversation._id}?page=${nextPage}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.length < 50) setHasMore(false);
        setPage(nextPage);
        
        const previousScrollHeight = e.target.scrollHeight;
        
        setMessages(prev => [...res.data, ...prev]);
        
        setTimeout(() => {
          if (e.target) e.target.scrollTop = e.target.scrollHeight - previousScrollHeight;
        }, 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const handleTouchStart = (e, msgId) => {
    setTouchStartX(e.touches[0].clientX);
    setSwipingId(msgId);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!swipingId) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    if (diff > 0 && diff < 80) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = (msg) => {
    if (swipeOffset > 40) {
      setReplyingTo(msg);
    }
    setSwipingId(null);
    setSwipeOffset(0);
    setTouchStartX(0);
  };

  const handleSend = async (e) => {
    if(e) e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/send`, {
        conversationId: conversation._id,
        text: newMessage,
        fileUrl: null,
        fileType: null,
        replyTo: replyingTo ? replyingTo._id : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
      setReplyingTo(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear this chat for yourself?")) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/clear`, { conversationId: conversation._id }, {
         headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]); // Cleared locally
      setShowSettings(false);
    } catch (err) {
      console.error(err);
      alert("Failed to clear chat");
    }
  };

  const handleDeleteMessage = async (type) => {
    if (!selectedMessage) return;
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/chat/messages/${selectedMessage._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { type } // Axios allows body in delete via 'data' config
      });

      if (type === 'forMe') {
        setMessages(prev => prev.filter(m => m._id !== selectedMessage._id));
      } else if (type === 'forEveryone') {
        setMessages(prev => prev.map(m => {
          if (m._id === selectedMessage._id) {
            return { ...m, deletedForEveryone: true, text: "This message was deleted", fileUrl: null, fileType: null };
          }
          return m;
        }));
      }

      setSelectedMessage(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete message");
    }
  };

  const handleFileSelect = async (e) => {
    let file = e && e.target && e.target.files ? e.target.files[0] : e; // Access file or direct blob argument
    if (!file || !(file instanceof Blob)) return;

    setShowAttachmentMenu(false);
    setUploadingFile(true);

    try {
      if (file.type && file.type.startsWith('image/') && !file.type.includes('gif') && !file.type.includes('svg')) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        try {
          const compressed = await imageCompression(file, options);
          file = new File([compressed], file.name, { type: file.type });
        } catch (err) {
          console.error("Compression failed", err);
        }
      }

      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      formData.append("file", file);

      // 1. Upload file
      const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // 2. Send message with the returned fileUrl
      const { fileUrl, fileType } = uploadRes.data;
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat/send`, {
        conversationId: conversation._id,
        text: "",
        fileUrl,
        fileType,
        replyTo: replyingTo ? replyingTo._id : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages((prev) => [...prev, res.data]);
      setReplyingTo(null);

    } catch (err) {
      console.error(err);
      alert("Failed to upload file.");
    } finally {
      setUploadingFile(false);
      // Reset input
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        handleFileSelect(audioFile); // Reuse upload logic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Recording error:", err);
      alert("Microphone access is required for voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = []; // Clear chunks to prevent upload
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Helper to initialize WebRTC and Audio
  const setupMediaAndWebRTC = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio calls, or you are testing on mobile without HTTPS (secure connection required).");
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      if (localAudioRef.current) localAudioRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Add local tracks to WebRTC
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle receiving remote tracks
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
      };

      // Send ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('iceCandidate', { targetId: partner._id, candidate: event.candidate });
        }
      };
      return true;
    } catch (err) {
      console.error("Failed to get media devices:", err);
      alert("Microphone access is required for calls.");
      return false;
    }
  };

  const handleEndCallCleanup = () => {
    setCallState(null);
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
  };

  // Call Handlers
  const initiateCall = async () => {
    const success = await setupMediaAndWebRTC();
    if (!success) return;
    setCallState('calling');
    socketRef.current.emit('incomingCall', { targetId: partner._id, callerName: sessionStorage.getItem('userName') || 'User' });
  };
  const answerCall = async () => {
    const success = await setupMediaAndWebRTC();
    if (!success) return;
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    setCallState('active');
    socketRef.current.emit('callAnswered', { targetId: partner._id });
  };
  const rejectCall = () => {
    handleEndCallCleanup();
    socketRef.current.emit('callRejected', { targetId: partner._id });
  };
  const endCall = () => {
    handleEndCallCleanup();
    socketRef.current.emit('callEnded', { targetId: partner._id });
  };

  const formatTime = (dateString) => {
    if (!dateString) return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh', background: 'var(--background)' }}>
      <div className="aura-orb" style={{ position: 'relative', width: '80px', height: '80px' }}></div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--background)', overflow: 'hidden', position: 'relative' }}>
      
      {/* Hidden Audio Elements for WebRTC Streams and Ringtone */}
      <audio ref={localAudioRef} autoPlay muted style={{ display: 'none' }} />
      <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
      <audio ref={ringtoneRef} src="https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3" loop style={{ display: 'none' }} />

      {/* Hidden File Input for attachments */}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
      
      {/* Call UI Overlay */}
      {callState && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <img src={partner?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${partner?.name}`} style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '20px', border: '2px solid rgba(255,255,255,0.1)' }} alt="" />
          <h2 style={{ margin: '0 0 10px 0' }}>{partner?.name}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '50px' }}>
            {callState === 'calling' && 'Calling...'}
            {callState === 'incoming' && 'Incoming Call...'}
            {callState === 'active' && `${formatDuration(callDuration)} (Call Active)`}
          </p>
          <div style={{ display: 'flex', gap: '30px' }}>
            {callState === 'incoming' && (
              <button onClick={answerCall} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#10b981', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}><Phone size={28} /></button>
            )}
            <button onClick={callState === 'incoming' ? rejectCall : endCall} style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}>
               <Phone size={28} style={{ transform: 'rotate(135deg)' }} />
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1000px', margin: '0 auto', width: '100%', background: 'rgba(15, 23, 42, 1)', height: '100dvh' }}>
        
        {/* Header */}
        <div style={{ padding: '10px 15px', display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', zIndex: 10, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '5px' }}>
              <ArrowLeft size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${partner?._id}`)}>
              {partner?.profileImage ? (
                <img src={partner.profileImage} alt={partner?.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                  {partner?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'white', lineHeight: '1.2' }}>{partner?.name || 'User'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', color: 'white' }}>
            <button onClick={initiateCall} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><Phone size={22} /></button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><MoreVertical size={22} /></button>
              {showSettings && (
                <div style={{ position: 'absolute', top: '100%', right: '0', background: '#1e293b', borderRadius: '8px', padding: '8px 0', minWidth: '150px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100 }}>
                  <div onClick={() => navigate(`/profile/${partner?._id}`)} style={{ padding: '10px 15px', color: 'white', cursor: 'pointer', fontSize: '0.95rem' }} onMouseOver={e=>e.target.style.background='rgba(255,255,255,0.05)'} onMouseOut={e=>e.target.style.background='transparent'}>View contact</div>
                  <div onClick={handleClearChat} style={{ padding: '10px 15px', color: '#f87171', cursor: 'pointer', fontSize: '0.95rem' }} onMouseOver={e=>e.target.style.background='rgba(255,255,255,0.05)'} onMouseOut={e=>e.target.style.background='transparent'}>Clear chat</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '15px 10px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', backgroundSize: '150px', backgroundColor: '#0b141a', backgroundBlendMode: 'overlay' }}>
          
          {isLoadingMore && <div style={{ textAlign: 'center', color: '#8696a0', fontSize: '0.85rem', padding: '10px' }}>Loading older messages...</div>}

          {messages.map((m, i) => {
            const isMe = m.sender === sessionStorage.getItem('userId');
            return (
              <div 
                ref={i === messages.length - 1 ? scrollRef : null} 
                key={m._id || i} 
                onTouchStart={e => handleTouchStart(e, m._id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(m)}
                style={{ 
                  alignSelf: isMe ? 'flex-end' : 'flex-start', 
                  maxWidth: '85%', 
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transform: swipingId === m._id ? `translateX(${swipeOffset}px)` : 'none',
                  transition: swipingId === m._id ? 'none' : 'transform 0.2s ease-out',
                  zIndex: selectedMessage?._id === m._id ? 10 : 1
                }}
              >
                <div 
                  onClick={(e) => {
                     // don't toggle if swiping or clicking a link
                     if (swipeOffset === 0 && e.target.tagName !== 'A' && e.target.tagName !== 'IMG' && e.target.tagName !== 'VIDEO') {
                       setSelectedMessage(selectedMessage?._id === m._id ? null : m);
                     }
                  }}
                  style={{ 
                  background: isMe ? '#005c4b' : '#202c33', 
                  padding: m.fileUrl && !m.text ? '4px' : '6px 10px 8px 10px', 
                  borderRadius: '12px', 
                  borderTopRightRadius: isMe ? '0px' : '12px', 
                  borderTopLeftRadius: isMe ? '12px' : '0px',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.15)',
                  color: m.deletedForEveryone ? 'rgba(255,255,255,0.6)' : '#e9edef',
                  fontStyle: m.deletedForEveryone ? 'italic' : 'normal',
                  minWidth: '80px',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}>
                  {/* Quoted Reply Preview */}
                  {m.replyTo && !m.deletedForEveryone && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '8px', borderLeft: '4px solid #53bdeb', marginBottom: '6px', fontSize: '0.8rem' }}>
                      <div style={{ color: '#53bdeb', fontWeight: 'bold', marginBottom: '2px' }}>{m.replyTo.sender === sessionStorage.getItem('userId') ? 'You' : partner?.name || 'User'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.replyTo.text || '📄 Attachment'}</div>
                    </div>
                  )}

                  {/* File Rendering */}
                  {m.fileUrl && !m.deletedForEveryone && (
                    <div style={{ marginBottom: m.text ? '8px' : '0' }}>
                      {m.fileType?.startsWith('image/') ? (
                        <img src={m.fileUrl} alt="attachment" style={{ maxWidth: '250px', maxHeight: '250px', borderRadius: '8px', cursor: 'pointer', display: 'block' }} onClick={() => window.open(m.fileUrl, '_blank')} />
                      ) : m.fileType?.startsWith('video/') ? (
                        <video src={m.fileUrl} controls style={{ maxWidth: '250px', maxHeight: '250px', borderRadius: '8px', display: 'block' }} />
                      ) : m.fileType?.startsWith('audio/') ? (
                        <audio src={m.fileUrl} controls style={{ width: '220px', height: '40px' }} />
                      ) : (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
                          <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Paperclip size={20} color="#e9edef" />
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Document</div>
                            <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#53bdeb', textDecoration: 'none' }}>Download/Open</a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {m.text && <p style={{ margin: 0, wordBreak: 'break-word', fontSize: '1rem', lineHeight: '1.3', paddingRight: isMe ? '50px' : '40px' }}>{m.text}</p>}
                  <div style={{ 
                    fontSize: '0.65rem', 
                    color: 'rgba(255,255,255,0.6)', 
                    position: 'absolute',
                    bottom: '6px',
                    right: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {formatTime(m.createdAt)}
                    {isMe && !m.deletedForEveryone && (
                      m.seen ? <CheckCheck size={15} color="#53bdeb" /> : <Check size={15} color="rgba(255,255,255,0.6)" />
                    )}
                  </div>

                  {/* Message Options Modal (Moved outside bubble for proper absolute positioning) */}
                </div>

                {selectedMessage?._id === m._id && (
                   <div style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      right: isMe ? '0' : 'auto',
                      left: isMe ? 'auto' : '0',
                      marginTop: '4px',
                      background: '#233138', 
                      borderRadius: '8px', 
                      padding: '8px 0', 
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)', 
                      zIndex: 100,
                      minWidth: '160px',
                      display: 'flex', 
                      flexDirection: 'column',
                      border: '1px solid rgba(255,255,255,0.05)'
                   }}>
                      <div onClick={(e) => { e.stopPropagation(); handleDeleteMessage('forMe'); }} style={{ padding: '10px 15px', color: '#e9edef', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }} onMouseOver={e=>e.target.style.background='rgba(255,255,255,0.05)'} onMouseOut={e=>e.target.style.background='transparent'}>
                        Delete for me
                      </div>
                      {isMe && !m.deletedForEveryone && (
                         <div onClick={(e) => { e.stopPropagation(); handleDeleteMessage('forEveryone'); }} style={{ padding: '10px 15px', color: '#f87171', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }} onMouseOver={e=>e.target.style.background='rgba(255,255,255,0.05)'} onMouseOut={e=>e.target.style.background='transparent'}>
                           Delete for everyone
                         </div>
                      )}
                   </div>
                )}
              </div>
            );
          })}
          
          {uploadingFile && (
            <div style={{ alignSelf: 'flex-end', maxWidth: '85%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#005c4b', padding: '10px 15px', borderRadius: '12px', borderTopRightRadius: '0px', color: '#e9edef', fontSize: '0.85rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                Sending file...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            </div>
          )}

          {isTyping && (
            <div ref={scrollRef} style={{ alignSelf: 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
               <div style={{ background: '#202c33', padding: '8px 12px', borderRadius: '12px', borderTopLeftRadius: '0px', color: '#8696a0', fontSize: '0.85rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 typing
                 <span style={{ display: 'flex', gap: '3px' }}>
                    <span style={{ width: '4px', height: '4px', background: '#8696a0', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                    <span style={{ width: '4px', height: '4px', background: '#8696a0', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                    <span style={{ width: '4px', height: '4px', background: '#8696a0', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                 </span>
                 <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
               </div>
            </div>
          )}
        </div>

        {/* WhatsApp Mobile Style Footer */}
        <div style={{ background: '#0b141a', padding: '8px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Reply Preview Above Input */}
          {replyingTo && (
            <div style={{ background: '#202c33', padding: '10px 15px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #00a884', marginBottom: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                 <span style={{ color: '#00a884', fontSize: '0.85rem', fontWeight: 'bold' }}>Replying to {replyingTo.sender === sessionStorage.getItem('userId') ? 'yourself' : partner?.name || 'User'}</span>
                 <span style={{ color: '#8696a0', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyingTo.text || '📄 Attachment'}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer' }}><X size={20} /></button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
            {/* Attachment Menu Popup */}
          {showAttachmentMenu && (
             <div style={{ position: 'absolute', bottom: '65px', left: '15px', background: '#1e293b', borderRadius: '16px', padding: '15px', display: 'flex', gap: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100 }}>
                <div onClick={() => fileInputRef.current.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                   <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                     <Paperclip size={24} />
                   </div>
                   <span style={{ fontSize: '0.8rem', color: 'white' }}>Document</span>
                </div>
                <div onClick={() => fileInputRef.current.click()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                   <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                     <Camera size={24} />
                   </div>
                   <span style={{ fontSize: '0.8rem', color: 'white' }}>Camera</span>
                </div>
             </div>
          )}

          <div style={{ flex: 1, background: '#202c33', borderRadius: '24px', display: 'flex', alignItems: 'center', padding: '0 12px', minHeight: '48px', position: 'relative' }}>
            {/* Emojis Popup */}
            {showEmojis && (
              <div style={{ position: 'absolute', bottom: '100%', left: '0', background: '#1e293b', borderRadius: '12px', padding: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap', width: 'max-content', maxWidth: '300px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)', zIndex: 100, marginBottom: '10px' }}>
                {EMOJIS.map(emoji => (
                  <span key={emoji} onClick={() => setNewMessage(prev => prev + emoji)} style={{ fontSize: '1.5rem', cursor: 'pointer', userSelect: 'none' }}>
                    {emoji}
                  </span>
                ))}
              </div>
            )}

            {!isRecording ? (
              <>
                {/* Emoticon placeholder */}
                <div onClick={() => setShowEmojis(!showEmojis)} style={{ color: '#8696a0', marginRight: '8px', cursor: 'pointer' }}>
                   <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z"></path></svg>
                </div>
                <textarea 
                  style={{ 
                    width: '100%', 
                    padding: '12px 0', 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#e9edef', 
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'none',
                    maxHeight: '100px',
                    lineHeight: '20px'
                  }} 
                  rows="1"
                  placeholder="Message" 
                  value={newMessage} 
                  onChange={e => {
                    setNewMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = (e.target.scrollHeight) + 'px';
                    
                    socketRef.current.emit('typing', { targetId: partner._id });
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                      socketRef.current.emit('stopTyping', { targetId: partner._id });
                    }, 2000);
                  }}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: '15px', color: '#8696a0', alignItems: 'center', marginLeft: '8px' }}>
                  <Paperclip size={22} style={{ cursor: 'pointer' }} onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} />
                  <Camera size={22} style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current.click()} />
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', padding: '0 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }}></div>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>{formatDuration(recordingTime)}</span>
                  <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }`}</style>
                </div>
                <button onClick={cancelRecording} style={{ background: 'transparent', border: 'none', color: '#8696a0', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
              </div>
            )}
          </div>
          
          {newMessage.trim() || isRecording ? (
            <button 
              onClick={isRecording ? stopRecording : handleSend}
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: '#00a884', 
                color: 'white', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                flexShrink: 0
              }} 
            >
               <Send size={22} style={{ transform: 'translateX(2px)' }} />
            </button>
          ) : (
            <button 
              onClick={startRecording}
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: '#00a884', 
                color: 'white', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                flexShrink: 0
              }} 
            >
               <Mic size={22} />
            </button>
          )}
        </div>
        </div>

      </div>
    </div>
  );
};

export default Messages;
