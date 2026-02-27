import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import { withAuth, AuthenticatedRequest } from '../lib/middleware';
import { supabaseAdmin } from '../lib/supabase';

const corsMiddleware = cors({
  methods: ['PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: '*',
});

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'PUT') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const userId = req.user!.userId;
      const { full_name, bio, avatar_url } = req.body;

      // Build update object
      const updateData: any = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (bio !== undefined) updateData.bio = bio;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      // Update user profile
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, username, full_name, avatar_url, bio, role')
        .single();

      if (error || !updatedUser) {
        return res.status(500).json({
          error: 'Failed to update profile',
          details: error?.message,
        });
      }

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        error: 'Failed to update profile',
        details: error.message,
      });
    }
  });
}

export default withAuth(handler);
