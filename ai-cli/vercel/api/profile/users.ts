import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import { withAuth, AuthenticatedRequest } from '../lib/middleware';
import { supabaseAdmin } from '../lib/supabase';

const corsMiddleware = cors({
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: '*',
});

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const userId = req.user!.userId;
      const { username } = req.query;

      // Get other user's profile by username
      if (!username) {
        return res.status(400).json({ error: 'Username query parameter is required' });
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, username, full_name, avatar_url, bio, role, created_at')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't show sensitive info for other users
      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role,
          created_at: user.created_at,
        },
      });
    } catch (error: any) {
      console.error('Get user error:', error);
      return res.status(500).json({
        error: 'Failed to fetch user',
        details: error.message,
      });
    }
  });
}

export default withAuth(handler);
