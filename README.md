# CreatorsHub 🚀

CreatorsHub is a dynamic platform designed for creators to showcase their portfolios, discover and collaborate with others, and communicate in real-time. Whether you're a designer, developer, writer, or artist, CreatorsHub provides the tools to build your professional presence and find your next collaboration.

## 🛠️ Tech Stack

### Frontend
- **React 19**: Modern UI library for building component-based interfaces.
- **Vite**: Ultra-fast build tool and development server.
- **React Router 7**: Declarative routing for seamless navigation.
- **Axios**: Promised-based HTTP client for API communication.
- **Socket.io-client**: Real-time bidirectional event-based communication.
- **Lucide React**: Clean and consistent icon set.

### Backend
- **Node.js & Express**: Robust and scalable server-side framework.
- **MongoDB & Mongoose**: Flexible NoSQL database with schema-based modeling.
- **Socket.io**: Powers real-time messaging and notifications.
- **JWT (JSON Web Tokens)**: Secure authentication and session management.
- **Multer**: Middleware for handling `multipart/form-data` (file uploads).
- **WebRTC**: Peer-to-peer audio/video calling capabilities.

## ✨ Key Features

- **User Authentication**: Secure sign-up, login, and profile management.
- **Dynamic Portfolios**: Showcase your work with a customizable profile.
- **Creator Discovery**: Search and discover other creators based on skills and interests.
- **Collaboration System**: Send and manage collaboration requests.
- **Real-time Messaging**: Instant chat with support for file, image, and video sharing.
- **Audio/Video Calls**: High-quality peer-to-peer communication via WebRTC.
- **Dashboard**: Centralized hub for tracking your activities and collaborations.

## 📁 Project Structure

```text
CreatorsHub/
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components (Login, Dashboard, etc.)
│   │   ├── assets/         # Static assets
│   │   └── App.jsx         # Main application component
├── backend/                 # Node.js server
│   ├── src/
│   │   ├── controllers/    # Business logic for routes
│   │   ├── models/         # MongoDB schemas (User, Message, etc.)
│   │   ├── routes/         # API endpoints
│   │   ├── sockets/        # Real-time event handlers
│   │   ├── config/         # Database and server configuration
│   │   └── uploads/        # Local storage for uploaded files
└── README.md                # Project documentation (Common root)
```

## ⚙️ Internal Working & Flow

### 1. Authentication Flow
- Users register with credentials, which are hashed using **Bcrypt** before storage.
- Authentication is handled via **JWT**. Tokens are issued upon login and validated using a custom `protect` middleware for subsequent API calls.

### 2. Real-time Communication
- **Socket.io** enables instantaneous message delivery.
- When a user sends a message, it is persisted in MongoDB and simultaneously emitted to the recipient's socket.
- **WebRTC** is used for calling, where the server acts as a signaling channel to exchange ICE candidates and SDP offers/answers between peers.

### 3. File Storage Process
- **Multer** is configured to handle file uploads.
- Currently; files are stored locally in the `backend/src/uploads` directory.
- The server generates a public URL for each file, which is then stored in the database and sent to the frontend for display.

### 4. Collaboration Workflow
- Users can send collaboration requests from another creator's profile.
- Requests are tracked in the database and notifications are sent via Sockets/Web-push.
- Once accepted, both users can transition to the messaging interface to discuss details.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/GNANESH6/CreatorsHub.git
   cd CreatorsHub
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file with PORT, MONGO_URI, and JWT_SECRET
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   # Ensure the API URL in config is pointing to the backend
   npm run dev
   ```

## 📄 License
This project is licensed under the MIT License.
