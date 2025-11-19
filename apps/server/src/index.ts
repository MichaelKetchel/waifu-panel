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
import votesRouter from './routes/votes.js';
import authRouter from './routes/auth.js';
import { getUploadsDir } from './lib/storage.js';
import { registerControlNamespace } from './sockets/control.js';
import { registerDisplayNamespace } from './sockets/display.js';
import { registerAudienceNamespace } from './sockets/audience.js';
import { registerSubmissionNamespace } from './sockets/submission.js';
import { queueEvents } from './events/queueEvents.js';
import { roundsEvents } from './events/roundEvents.js';

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

app.use('/uploads', express.static(getUploadsDir()));

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/submissions', submissionsRouter);
app.use('/api/characters/queue', queueRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/rounds', roundsRouter);
app.use('/api/votes', votesRouter);
app.use('/api/auth', authRouter);

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: allowedOrigins.length > 0
  }
});

registerControlNamespace(io);
registerDisplayNamespace(io);
registerAudienceNamespace(io);
registerSubmissionNamespace(io);

queueEvents.initialize(io);
roundsEvents.initialize(io);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
