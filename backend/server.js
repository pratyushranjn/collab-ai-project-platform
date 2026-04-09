require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const setupSocket = require('./sockets/index');
const cookieParser = require('cookie-parser');
const helmet = require("helmet");
const { connectRedis, client } = require("./config/redis")
const morganMiddleware = require("./middleware/logger");
const mongoose = require("mongoose");

const authRoute = require('./routes/AuthRoutes');
const projectRoutes = require('./routes/ProjectRoutes');
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const aiRoutes = require('./routes/aiRoutes')
const chatRoutes = require('./routes/chatRoutes')
const dashboardRoutes = require('./routes/Admin/dashboardRoutes');
const panelRoutes = require('./routes/Admin/panelRoutes');
const passwordRecovery = require("./routes/forgot-passwordRoute.js");


const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://collab-ai-hub.vercel.app",
  "https://www.pratyushnode.tech"
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
app.use(morganMiddleware);

// Routes
app.use('/api/auth', [authRoute, passwordRecovery]);
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

(async () => {
  try {
    await connectDB();
    await connectRedis();

    server.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();


process.on("SIGINT", async () => {
  console.log("Shutting down...");

  if (client.isOpen) {
    await client.quit();
    console.log("Redis disconnected");
  }

  await mongoose.connection.close();
  console.log("MongoDB disconnected");

  process.exit(0);
});