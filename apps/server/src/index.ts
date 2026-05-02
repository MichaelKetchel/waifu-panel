import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';

import './lib/env.js';
import moderationRouter from './routes/moderation.js';
import queueRouter from './routes/queue.js';
import roundsRouter from './routes/rounds.js';
import submissionsRouter from './routes/submissions.js';
import votesRouter from './routes/votes.js';
import authRouter from './routes/auth.js';
import configRouter from './routes/config.js';
import { getUploadsDir } from './lib/storage.js';
import { prisma } from './lib/prisma.js';
import { registerControlNamespace } from './sockets/control.js';
import { registerDisplayNamespace } from './sockets/display.js';
import { registerAudienceNamespace } from './sockets/audience.js';
import { registerSubmissionNamespace } from './sockets/submission.js';
import { queueEvents } from './events/queueEvents.js';
import { roundsEvents } from './events/roundEvents.js';
import { queueService } from './services/queueService.js';

const PORT = Number(process.env.PORT ?? 3000);
const allowedOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
const allowedOriginSet = new Set(allowedOrigins.map(normalizeOrigin));
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const webDistDir = path.resolve(moduleDir, '..', '..', 'web', 'dist');

const corsOptions: CorsOptions = {
  origin: allowedOrigins.length > 0
    ? (origin, callback) => {
        callback(null, !origin || allowedOriginSet.has(normalizeOrigin(origin)));
      }
    : true,
  credentials: true
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.options('*', cors(corsOptions));

app.use('/uploads', express.static(getUploadsDir()));

app.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const queue = await queueService.snapshot();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      database: 'ok',
      queueLength: queue.length
    });
  } catch (error) {
    console.error('Health check failed', error);
    res.status(503).json({
      status: 'error',
      uptime: process.uptime(),
      database: 'error'
    });
  }
});

app.use('/api/submissions', submissionsRouter);
app.use('/api/characters/queue', queueRouter);
app.use('/api/moderation', moderationRouter);
app.use('/api/rounds', roundsRouter);
app.use('/api/votes', votesRouter);
app.use('/api/auth', authRouter);
app.use('/api/config', configRouter);

if (fs.existsSync(webDistDir)) {
  app.use(express.static(webDistDir));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }

    return res.sendFile(path.join(webDistDir, 'index.html'));
  });
}

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins.length > 0
      ? (origin, callback) => {
          callback(null, !origin || allowedOriginSet.has(normalizeOrigin(origin)));
        }
      : '*',
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

function normalizeOrigin(origin: string) {
  try {
    const url = new URL(origin);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    return url.origin;
  } catch {
    return origin.trim().toLowerCase().replace(/\/$/, '');
  }
}
