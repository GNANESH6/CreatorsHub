# CreatorsHub 🚀

CreatorsHub is a dynamic platform designed for creators to connect, collaborate, and showcase their portfolios. It streamlines the process of finding like-minded creators and provides real-time communication tools to foster creative partnerships.

## 🛠️ Technology Stack

### Frontend
- **React (Vite)**: Fast and modern UI development.
- **React Router DOM**: Client-side routing for seamless navigation.
- **Axios**: Promised-based HTTP client for API communication.
- **Socket.io-client**: Real-time bi-directional communication.
- **Lucide React**: Beautiful and consistent iconography.
- **Browser Image Compression**: Optimized image handling before upload.

### Backend
- **Node.js & Express**: Scalable server-side architecture.
- **MongoDB (Mongoose)**: Flexible NoSQL database for data persistence.
- **Socket.io**: Real-time messaging and notification system.
- **Web Push**: Browser-based push notifications.
- **JWT (JSON Web Tokens)**: Secure authentication and session management.
- **Bcrypt**: Industrial-grade password hashing.
- **Multer**: Middleware for handling multipart/form-data (file uploads).

### Tools & Deployment
- **ESLint**: Code quality and consistency.
- **Nodemon**: Automated development server restarts.
- **Vercel**: Frontend deployment.
- **Render**: Backend deployment.

---

## ⚙️ Internal Working

CreatorsHub follows the **MERN** (MongoDB, Express, React, Node.js) architecture.

1.  **Client-Server Communication**: The frontend communicates with the backend via RESTful APIs for standard data operations (auth, profile updates, discovery) and WebSockets (Socket.io) for real-time features.
2.  **Real-time Engine**: A centralized socket server handles message broadcasting, online status tracking, and instant notifications.
3.  **Authentication**: Uses a stateless JWT-based approach. The token is generated upon login and used in the `Authorization` header for protected routes.
4.  **Middleware**: Backend uses custom mission-critical middleware for authentication (`protect`) and error handling.

---

## 🔄 Working Flow

1.  **Authentication**: Users register or log in securely.
2.  **Onboarding**: New users are guided through a `Profile Setup` to define their skills, niche, and portfolio.
3.  **Discovery**: High-performance "Discover" page allows users to browse other creators with filtering capabilities.
4.  **Collaboration**: Users can visit profiles and initiate collaboration requests.
5.  **Communication**: Once connected, users can engage in real-time chat, share media, and receive push notifications for new messages.

---

## 💾 Storage Process

### 📂 Database (MongoDB)
- **User Models**: Stores credentials, profile details, and preferences.
- **Chat Models**: Persists message history and room metadata.
- **Collaboration Models**: Tracks the status of partnerships between creators.

### 📁 File Management
- **Uploads**: Handled via `Multer` on the backend.
- **Optimization**: The frontend uses `browser-image-compression` to reduce payload size before transmission.
- **Persistence**: Files are currently stored on the local filesystem of the backend server in the `src/uploads` directory and served statically.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### Local Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/GNANESH6/CreatorsHub.git
    cd CreatorsHub
    ```

2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    # Create a .env file with: PORT, MONGO_URI, JWT_SECRET
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
