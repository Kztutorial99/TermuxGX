import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';

const corsMiddleware = cors({
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: '*',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  corsMiddleware(req, res, () => {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Note: JWT tokens are stateless, so we can't truly "logout"
    // The client should delete the token from their storage
    return res.status(200).json({
      message: 'Logout successful. Please delete the token from your client.',
    });
  });
}
