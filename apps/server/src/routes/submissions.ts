import fs from 'node:fs/promises';
import path from 'node:path';

import { Router as createRouter } from 'express';
import type { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { getPublicPathForFile, getUploadsDir } from '../lib/storage.js';
import { createSubmission, ensureSubmitter } from '../services/submitterService.js';
import { SUBMITTER_COOKIE } from '../utils/constants.js';

const router: Router = createRouter();

const submissionSchema = z.object({
  name: z.string().min(1),
  series: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional()
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, getUploadsDir());
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '') || '.png';
      const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
      cb(null, filename);
    }
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed.'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  const cleanupUploadedFile = async () => {
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch {
        // ignore cleanup errors
      }
    }
  };

  const parseResult = submissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    await cleanupUploadedFile();
    return res.status(400).json({ message: 'Invalid submission payload', issues: parseResult.error.issues });
  }

  const imageSource = req.file ? getPublicPathForFile(req.file.filename) : parseResult.data.imageUrl;
  if (!imageSource) {
    await cleanupUploadedFile();
    return res.status(400).json({ message: 'Please attach an image or provide an image URL.' });
  }

  try {
    const existingToken = req.cookies[SUBMITTER_COOKIE] as string | undefined;
    const { submitter } = await ensureSubmitter(existingToken);

    if (!existingToken || existingToken !== submitter.token) {
      res.cookie(SUBMITTER_COOKIE, submitter.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 365
      });
    }

    const result = await createSubmission(submitter.id, {
      name: parseResult.data.name,
      series: parseResult.data.series,
      description: parseResult.data.description,
      imagePath: imageSource
    });

    return res.status(202).json({
      message: 'Submission received',
      submissionId: result.characterId,
      queuePosition: result.queuePosition,
      remainingSlots: result.remainingSlots,
      status: result.status,
      imagePath: imageSource
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error as any).code === 'SUBMISSION_LIMIT') {
      await cleanupUploadedFile();
      return res.status(429).json({
        message: 'Submission limit reached for this device',
        code: 'SUBMISSION_LIMIT'
      });
    }

    console.error('Submission error', error);
    await cleanupUploadedFile();
    return res.status(500).json({ message: 'Failed to create submission' });
  }
});

router.get('/status/:id', async (req, res) => {
  const character = await prisma.character.findUnique({
    where: { id: req.params.id },
    include: {
      queuePosition: true
    }
  });

  if (!character) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  return res.json({
    submissionId: character.id,
    status: character.status,
    position: character.queuePosition?.position ?? null,
    imagePath: character.imagePath
  });
});

export default router;
