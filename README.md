# Collaborative Platform

A comprehensive real-time collaborative platform for project management, team communication, and productivity enhancement with AI-powered features.

## Features

### 🚀 Core Features
- **Real-time Collaboration**: Live document editing, whiteboard collaboration, and instant messaging
- **Project Management**: Task management, project timelines, team assignments, and progress tracking
- **AI Integration**: Intelligent task suggestions, idea analysis, and meeting summaries
- **File Management**: Secure file upload, sharing, and version control
- **Team Communication**: Chat rooms, video calls, and notifications

### 🛠 Technical Features
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Real-time Updates**: WebSocket connections for instant synchronization
- **Responsive Design**: Modern UI with Material-UI components
- **API Documentation**: Comprehensive REST API with proper documentation
- **Data Persistence**: MongoDB database with optimized queries

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **AI Integration**: OpenAI API
- **File Upload**: Multer
- **Validation**: Joi
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router
- **Forms**: Formik + Yup
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Charts**: Chart.js
- **Date Handling**: date-fns

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
   - Set MongoDB connection string
   - Add JWT secret
   - Configure OpenAI API key
   - Set email credentials (optional)

5. Start the development server:
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file if needed (default values should work for local development)

5. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:5173`

## Project Structure

```
collaborative-platform/
├── backend/                    # Backend application
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Custom middleware
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utility functions
│   │   ├── config/           # Configuration files
│   │   └── app.js            # Express app setup
│   ├── tests/                # Test files
│   ├── uploads/              # File uploads
│   ├── logs/                 # Application logs
│   └── server.js             # Server entry point
├── frontend/                  # Frontend application
│   ├── public/               # Static files
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Redux store
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Utility functions
│   │   ├── theme/            # UI theme
│   │   └── App.js            # Main app component
│   └── build/                # Production build
└── README.md                 # Project documentation
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/projects/:projectId/tasks` - Get project tasks
- `POST /api/projects/:projectId/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Messages
- `GET /api/messages/:roomId` - Get chat messages
- `POST /api/messages` - Send message

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Download file
- `DELETE /api/files/:id` - Delete file

## WebSocket Events

### Client → Server
- `join_room` - Join a project room
- `leave_room` - Leave a project room
- `send_message` - Send chat message
- `task_update` - Update task status
- `whiteboard_draw` - Draw on whiteboard

### Server → Client
- `message_received` - New message received
- `task_updated` - Task status changed
- `user_joined` - User joined room
- `user_left` - User left room
- `whiteboard_update` - Whiteboard updated

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/collaborative-platform
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-pro
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

### Frontend (.env)
```env
PORT=5173
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
REACT_APP_AI_ENABLED=true
```

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Formatting
```bash
# Format all code
npm run format

# Lint code
npm run lint
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd backend
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@collaborative-platform.com or join our Slack channel.

## Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced AI features (code review, smart scheduling)
- [ ] Integration with popular tools (Slack, Trello, GitHub)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Dark mode support
- [ ] Offline mode capabilities

---

Made with ❤️ by the Collaborative Platform Team
