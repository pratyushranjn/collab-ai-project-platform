require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db/db');
const http = require('http');
const setupSocket = require('./sockets/index');
const cookieParser = require('cookie-parser');
const helmet = require("helmet");

const authRoute = require('./routes/AuthRoutes');
const projectRoutes = require('./routes/ProjectRoutes');
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const aiRoutes = require('./routes/aiRoutes')
const chatRoutes = require('./routes/chatRoutes')
const dashboardRoutes = require('./routes/Admin/dashboardRoutes');
const panelRoutes = require('./routes/Admin/panelRoutes');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://collab-ai-hub.vercel.app"
];

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(helmet());
app.use(express.json());
app.use(cookieParser());


// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', userRoutes)
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes)

// AI Routes
app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);

// Admin Route
app.use('/api/admin', dashboardRoutes);
app.use('/api/admin', panelRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Server is healthy' });
});


// Setup Socket.IO
const io = setupSocket(server, allowedOrigins);
app.io = io; // access io in routes/controllers
app.set("io", io);


// Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  res.status(statusCode).json({ success: false, message });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

