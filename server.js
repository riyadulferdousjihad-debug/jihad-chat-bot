import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

if (!process.env.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is missing. Add it to .env before using the assistant.');
}
if (!process.env.APP_PASSWORD) {
  console.warn('WARNING: APP_PASSWORD is missing. Set a private password before deployment.');
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '2mb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 25, standardHeaders: 'draft-8', legacyHeaders: false }));

function requireAppPassword(req, res, next) {
  const expected = process.env.APP_PASSWORD;
  const supplied = req.get('x-app-password');
  if (!expected) return res.status(503).json({ error: 'সার্ভারে APP_PASSWORD সেট করা হয়নি।' });
  if (!supplied || supplied !== expected) return res.status(401).json({ error: 'পাসওয়ার্ড সঠিক নয়।' });
  next();
}
app.use('/api', requireAppPassword);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
      'application/json'
    ];
    cb(allowed.includes(file.mimetype) ? null : new Error('এই ফাইল ফরম্যাটটি সমর্থিত নয়। ছবি, PDF, TXT, CSV বা JSON দিন।'), allowed.includes(file.mimetype));
  }
});

const SYSTEM_INSTRUCTION = `
You are JIHAD CHAT BOT PERSONAL ASSISTANT, a helpful personal AI assistant.
Reply in the language the user uses; support natural Bangla and English.
Be clear, warm, practical, honest, and concise. Use headings and lists when useful.
Never claim you performed actions you did not perform. If uncertain, say so.
For current facts, use Google Search when the user asks for recent/current information.
Respect privacy. Do not ask for passwords, API keys, or sensitive credentials.
When analyzing an uploaded file, rely on its contents and say if it is unreadable.
`;

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'JIHAD CHAT BOT PERSONAL ASSISTANT' }));
app.get('/api/check', (_req, res) => res.json({ ok: true }));

app.post('/api/chat', upload.array('files', 4), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'Gemini API Key সার্ভারে সেট করা হয়নি।' });

    const message = String(req.body.message || '').trim();
    const previousId = String(req.body.previousInteractionId || '').trim();
    const useSearch = req.body.useSearch === 'true';
    if (!message && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'একটি মেসেজ লিখুন অথবা ফাইল যোগ করুন।' });
    }

    const input = [{ type: 'text', text: message || 'Please analyze the attached file(s) and explain their contents.' }];
    for (const file of (req.files || [])) {
      const data = file.buffer.toString('base64');
      if (file.mimetype.startsWith('image/')) {
        input.push({ type: 'image', data, mime_type: file.mimetype });
      } else if (file.mimetype === 'application/pdf') {
        input.push({ type: 'document', data, mime_type: file.mimetype });
      } else {
        input.push({ type: 'text', text: `\n\n[Uploaded file: ${file.originalname}]\n${file.buffer.toString('utf8').slice(0, 100000)}` });
      }
    }

    const request = {
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      input,
      system_instruction: SYSTEM_INSTRUCTION,
      tools: useSearch ? [{ type: 'google_search' }] : undefined
    };
    if (previousId) request.previous_interaction_id = previousId;

    const interaction = await ai.interactions.create(request);
    const citations = [];
    for (const step of (interaction.steps || [])) {
      if (step.type === 'model_output') {
        for (const block of (step.content || [])) {
          for (const annotation of (block.annotations || [])) {
            if (annotation.type === 'url_citation' && annotation.url) {
              citations.push({ title: annotation.title || annotation.url, url: annotation.url });
            }
          }
        }
      }
    }
    res.json({
      text: interaction.output_text || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি।',
      interactionId: interaction.id,
      citations: [...new Map(citations.map(c => [c.url, c])).values()]
    });
  } catch (error) {
    console.error('Gemini request failed:', error);
    const status = error.status || 500;
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: error.message?.includes('API key') ? 'Gemini API Key যাচাই করুন।' : 'AI উত্তর তৈরি করতে পারেনি। সার্ভার লগ দেখুন অথবা আবার চেষ্টা করুন।'
    });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*path', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Request error' });
});

app.listen(PORT, () => console.log(`JIHAD CHAT BOT running at http://localhost:${PORT}`));
