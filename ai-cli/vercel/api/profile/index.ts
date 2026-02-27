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

      // Get user profile
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, username, full_name, avatar_url, bio, role, is_active, last_login, created_at')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get API key info (not the actual key value for security)
      const { data: apiKey } = await supabaseAdmin
        .from('api_keys')
        .select('id, key_name, is_active, is_used, created_at, expires_at, last_used_at')
        .eq('user_id', userId)
        .single();

      // Get stats
      const { count: sessionCount } = await supabaseAdmin
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: messageCount } = await supabaseAdmin
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', 'in', `(${supabaseAdmin
          .from('chat_sessions')
          .select('id')
          .eq('user_id', userId)
          .toString()
        })`);

      const { count: commandCount } = await supabaseAdmin
        .from('termux_command_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          role: user.role,
          is_active: user.is_active,
          last_login: user.last_login,
          created_at: user.created_at,
        },
        api_key: apiKey ? {
          id: apiKey.id,
          key_name: apiKey.key_name,
          is_active: apiKey.is_active,
          is_used: apiKey.is_used,
          created_at: apiKey.created_at,
          expires_at: apiKey.expires_at,
          last_used_at: apiKey.last_used_at,
        } : null,
        stats: {
          total_sessions: sessionCount || 0,
          total_messages: messageCount || 0,
          total_commands: commandCount || 0,
        },
      });
    } catch (error: any) {
      console.error('Profile error:', error);
      return res.status(500).json({
        error: 'Failed to fetch profile',
        details: error.message,
      });
    }
  });
}

export default withAuth(handler);
