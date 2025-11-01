import http from 'node:http';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';

import moderationRouter from './routes/moderation.js';
import queueRouter from './routes/queue.js';
import roundsRouter from './routes/rounds.js';
import submissionsRouter from './routes/submissions.js';

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);
const allowedOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);

const corsOptions: CorsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.options('*', cors(corsOptions));

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/submissions', submissionsRouter);
app.use('/api/characters/queue', queueRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/rounds', roundsRouter);

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*'
  }
});

io.of('/control').on('connection', (socket) => {
  // TODO: control namespace handlers
  socket.emit('state:init', { message: 'control namespace not yet implemented' });
});

io.of('/display').on('connection', (socket) => {
  socket.emit('state:init', { message: 'display namespace not yet implemented' });
});

io.of('/audience').on('connection', (socket) => {
  socket.emit('state:init', { message: 'audience namespace not yet implemented' });
});

io.of('/submission').on('connection', (socket) => {
  socket.emit('state:init', { message: 'submission namespace not yet implemented' });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
