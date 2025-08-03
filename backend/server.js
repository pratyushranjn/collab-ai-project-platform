const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require('./config/database');
const config = require('./config/config');

// Route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

// Connect to database
connectDB();

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (token) {
      const jwt = require('jsonwebtoken');
      const User = require('./models/User');
      
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user) {
        socket.user = user;
        return next();
      }
    }
    next(new Error('Authentication error'));
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.user.name} connected:`, socket.id);
  
  // Join user to their personal room
  socket.join(`user_${socket.user._id}`);
  
  // Handle project room joining
  socket.on('join_project', (projectId) => {
    socket.join(`project_${projectId}`);
    socket.to(`project_${projectId}`).emit('user_joined', {
      user: {
        id: socket.user._id,
        name: socket.user.name,
        avatar: socket.user.avatar
      }
    });
    console.log(`${socket.user.name} joined project ${projectId}`);
  });

  // Handle leaving project room
  socket.on('leave_project', (projectId) => {
    socket.leave(`project_${projectId}`);
    socket.to(`project_${projectId}`).emit('user_left', {
      user: {
        id: socket.user._id,
        name: socket.user.name
      }
    });
    console.log(`${socket.user.name} left project ${projectId}`);
  });

  // Handle whiteboard updates
  socket.on('whiteboard_update', (data) => {
    const { projectId, action, object } = data;
    socket.to(`project_${projectId}`).emit('whiteboard_update', {
      action,
      object,
      user: {
        id: socket.user._id,
        name: socket.user.name
      }
    });
  });

  // Handle cursor movement
  socket.on('cursor_move', (data) => {
    const { projectId, x, y } = data;
    socket.to(`project_${projectId}`).emit('cursor_move', {
      userId: socket.user._id,
      userName: socket.user.name,
      x,
      y
    });
  });

  // Handle chat messages
  socket.on('send_message', (data) => {
    const { projectId, content, type } = data;
    const messageData = {
      id: Date.now(),
      content,
      type: type || 'text',
      sender: {
        id: socket.user._id,
        name: socket.user.name,
        avatar: socket.user.avatar
      },
      timestamp: new Date()
    };
    
    // Broadcast to project room
    io.to(`project_${projectId}`).emit('new_message', messageData);
  });

  // Handle task updates
  socket.on('task_update', (data) => {
    const { projectId, taskId, updates } = data;
    socket.to(`project_${projectId}`).emit('task_updated', {
      taskId,
      updates,
      updatedBy: {
        id: socket.user._id,
        name: socket.user.name
      }
    });
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { projectId, chatType } = data;
    socket.to(`project_${projectId}`).emit('user_typing', {
      userId: socket.user._id,
      userName: socket.user.name,
      chatType
    });
  });

  socket.on('typing_stop', (data) => {
    const { projectId, chatType } = data;
    socket.to(`project_${projectId}`).emit('user_stopped_typing', {
      userId: socket.user._id,
      chatType
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected:`, socket.id);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io accessible to routes
app.set('socketio', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;