import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import { comparePassword, generateToken } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';

const corsMiddleware = cors({
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: '*',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { email, username, password } = req.body;

      // Validation
      if ((!email && !username) || !password) {
        return res.status(400).json({
          error: 'Email or username, and password are required',
        });
      }

      // Find user by email or username
      let query = supabaseAdmin
        .from('users')
        .select('id, email, username, password_hash, full_name, avatar_url, role, is_active');

      if (email) {
        query = query.eq('email', email);
      } else if (username) {
        query = query.eq('username', username);
      }

      const { data: user, error } = await query.single();

      if (error || !user) {
        return res.status(401).json({
          error: 'Invalid credentials',
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({
          error: 'Account is deactivated',
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
        });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Get API key status
      const { data: apiKeyData } = await supabaseAdmin
        .from('api_keys')
        .select('id, key_name, is_active, is_used, expires_at')
        .eq('user_id', user.id)
        .eq('is_used', false)
        .eq('is_active', true)
        .single();

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          role: user.role,
        },
        api_key_status: apiKeyData ? {
          is_available: true,
          key_name: apiKeyData.key_name,
          expires_at: apiKeyData.expires_at,
        } : {
          is_available: false,
          message: 'API key already used or inactive',
        },
        token,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message,
      });
    }
  });
}
