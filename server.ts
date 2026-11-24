import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function extractBase64Payload(input: string, fallbackMime = 'image/jpeg') {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(input.trim());
  if (match) {
    return {
      mimeType: ALLOWED_MIME_TYPES.has(match[1]) ? match[1] : fallbackMime,
      data: match[2],
    };
  }
  return {
    mimeType: ALLOWED_MIME_TYPES.has(fallbackMime) ? fallbackMime : 'image/jpeg',
    data: input.trim(),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.post('/api/verify-face', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          'Server verification is unavailable because GEMINI_API_KEY is not configured in Settings > Secrets.',
      });
    }

    const {
      selfieBase64,
      selfieMimeType,
      idPhotoBase64,
      idPhotoMimeType,
      captureSource,
    } = req.body ?? {};

    if (typeof selfieBase64 !== 'string' || selfieBase64.trim().length < 100) {
      return res.status(400).json({
        error: 'A live selfie capture or photo is required for face verification.',
      });
    }

    const selfie = extractBase64Payload(selfieBase64, selfieMimeType);
    const hasIdPhoto =
      typeof idPhotoBase64 === 'string' && idPhotoBase64.trim().length >= 100;
    const idPhoto = hasIdPhoto
      ? extractBase64Payload(idPhotoBase64, idPhotoMimeType)
      : null;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const parts: Array<
        | { inlineData: { mimeType: string; data: string } }
        | { text: string }
      > = [
        {
          inlineData: {
            mimeType: selfie.mimeType,
            data: selfie.data,
          },
        },
      ];

      if (idPhoto) {
        parts.push({
          inlineData: {
            mimeType: idPhoto.mimeType,
            data: idPhoto.data,
          },
        });
      }

      const instruction = hasIdPhoto
        ? `You are a roommate safety face-verification analyst for Dwell.
Image 1 is the user's live profile selfie (${captureSource === 'camera' ? 'captured from webcam' : 'uploaded photo'}).
Image 2 is the user's student/work/government photo ID.
Evaluate strictly:
1. singleFaceDetected: Is there exactly one clearly visible human face in Image 1?
2. clearUnobstructedFace: Are eyes, nose, and mouth clearly visible without sunglasses, heavy masks, or extreme blur/darkness?
3. antiSpoofPassed: Does Image 1 look like a genuine photograph of a real person (not a cartoon, AI illustration, blank wall, or obvious phone-screen photo with moire/bezels)?
4. idFaceMatch: Does the face in Image 1 appear to be the same person as the face in Image 2?
Set verified=true ONLY if all four checks pass. Provide confidenceScore (0-100), a brief summary, and if rejected, a clear rejectionReason telling the user how to retake.`
        : `You are a roommate safety face-verification analyst for Dwell.
Image 1 is the user's live profile selfie (${captureSource === 'camera' ? 'captured from webcam' : 'uploaded photo'}).
Evaluate strictly:
1. singleFaceDetected: Is there exactly one clearly visible human face in Image 1?
2. clearUnobstructedFace: Are eyes, nose, and mouth clearly visible without sunglasses, heavy masks, or extreme blur/darkness?
3. antiSpoofPassed: Does Image 1 look like a genuine photograph of a real person (not a cartoon, AI illustration, blank wall, or obvious phone-screen photo with moire/bezels)?
4. idFaceMatch: Set to true since no ID photo was provided for comparison.
Set verified=true ONLY if checks 1, 2, and 3 pass. Provide confidenceScore (0-100), a brief summary, and if rejected, a clear rejectionReason telling the user how to retake.`;

      parts.push({ text: instruction });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verified: { type: Type.BOOLEAN },
              confidenceScore: { type: Type.INTEGER },
              singleFaceDetected: { type: Type.BOOLEAN },
              clearUnobstructedFace: { type: Type.BOOLEAN },
              antiSpoofPassed: { type: Type.BOOLEAN },
              idFaceMatch: { type: Type.BOOLEAN },
              summary: { type: Type.STRING },
              rejectionReason: { type: Type.STRING },
            },
            required: [
              'verified',
              'confidenceScore',
              'singleFaceDetected',
              'clearUnobstructedFace',
              'antiSpoofPassed',
              'idFaceMatch',
              'summary',
              'rejectionReason',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        return res.status(502).json({
          error: 'Face verification service returned an empty response. Please try again.',
        });
      }

      const parsed = JSON.parse(rawText) as {
        verified: boolean;
        confidenceScore: number;
        singleFaceDetected: boolean;
        clearUnobstructedFace: boolean;
        antiSpoofPassed: boolean;
        idFaceMatch: boolean;
        summary: string;
        rejectionReason: string;
      };

      return res.json({
        ...parsed,
        idCompared: hasIdPhoto,
        captureSource: captureSource === 'camera' ? 'camera' : 'upload',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Face verification request failed.';
      return res.status(502).json({
        error: `Face verification failed: ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dwell server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
