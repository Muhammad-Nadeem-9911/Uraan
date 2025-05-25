const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const config = require('./config');
const { Server } = require("socket.io"); // Import Socket.IO Server
const { setIo } = require('./common/utils/socketManager'); // Import the setter

const PORT = config.port;

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: config.clientUrl, // Allow connections from your frontend URL
    methods: ['GET', 'POST'], // Allowed HTTP methods for CORS
  },
});

// Set the io instance in our utility
setIo(io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Handler for clients to join a competition-specific room
  socket.on('joinCompetitionRoom', (competitionId) => {
    const roomName = `competition-${competitionId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const startServer = async () => {
  await connectDB(); // Connect to MongoDB
  server.listen(PORT, () => {
    console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
    console.log(`Frontend expected at: ${config.clientUrl}`);
    console.log('Socket.IO server initialized and listening.');
  });
};

startServer();