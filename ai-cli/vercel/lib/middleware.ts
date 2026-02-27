import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthenticatedRequest extends VercelRequest {
  user?: {
    userId: string;
    email: string;
    username: string;
    role: string;
  };
}

export async function authMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  next: () => void
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No authorization token provided' });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Verify user exists and is active
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, username, role, is_active')
    .eq('id', payload.userId)
    .single();

  if (error || !user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ error: 'Account is deactivated' });
    return;
  }

  // Verify API key is valid and unused
  const { data: apiKey } = await supabaseAdmin
    .from('api_keys')
    .select('id, is_active, is_used')
    .eq('user_id', payload.userId)
    .eq('is_used', false)
    .eq('is_active', true)
    .single();

  if (!apiKey) {
    res.status(403).json({ 
      error: 'No valid API key found. Key may already be used or inactive.' 
    });
    return;
  }

  (req as AuthenticatedRequest).user = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  next();
}

export function withAuth(handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    await authMiddleware(req, res, async () => {
      await handler(req as AuthenticatedRequest, res);
    });
  };
}
