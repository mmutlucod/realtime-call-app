import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socket/socket';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ message: 'Video Call Server Running' });
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
  🚀 Server running on port ${PORT}
  📡 Socket.IO ready for connections
  `);
});