import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import { hashPassword, generateToken, generateApiKey } from '../lib/auth';
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
      const { email, username, password, full_name } = req.body;

      // Validation
      if (!email || !username || !password) {
        return res.status(400).json({
          error: 'Email, username, and password are required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters',
        });
      }

      if (username.length < 3) {
        return res.status(400).json({
          error: 'Username must be at least 3 characters',
        });
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .or(`email.eq.${email},username.eq.${username}`)
        .single();

      if (existingUser) {
        return res.status(409).json({
          error: 'User with this email or username already exists',
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Generate API key
      const apiKeyValue = generateApiKey();

      // Create user and API key using the database function
      const { data, error } = await supabaseAdmin.rpc('register_user_with_key', {
        p_email: email,
        p_username: username,
        p_password_hash: passwordHash,
        p_full_name: full_name || null,
      });

      if (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
          error: 'Failed to create user',
          details: error.message,
        });
      }

      // Generate JWT token
      const token = generateToken({
        userId: data.user_id,
        email,
        username,
        role: 'user',
      });

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user_id);

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: data.user_id,
          email,
          username,
          full_name: full_name || null,
        },
        api_key: apiKeyValue,
        token,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message,
      });
    }
  });
}
