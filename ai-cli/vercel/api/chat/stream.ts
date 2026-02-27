import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import { withAuth, AuthenticatedRequest } from '../lib/middleware';
import { streamingChatCompletion, ChatMessage } from '../lib/groq';
import { supabaseAdmin } from '../lib/supabase';

const corsMiddleware = cors({
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: '*',
});

const SYSTEM_PROMPT = `You are an AI assistant integrated with Termux. You can execute Termux commands and help users with development tasks. Be helpful, concise, and accurate.`;

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { message, sessionId } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const userId = req.user!.userId;

      // Get or create session
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const { data: newSession } = await supabaseAdmin
          .from('chat_sessions')
          .insert({
            user_id: userId,
            session_name: message.substring(0, 50) + '...',
          })
          .select('id')
          .single();

        currentSessionId = newSession.id;
      }

      // Get conversation history
      const { data: messages } = await supabaseAdmin
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true })
        .limit(20);

      // Build messages array
      const groqMessages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(messages || []).map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: message },
      ];

      // Save user message
      await supabaseAdmin.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'user',
        content: message,
      });

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Get streaming completion
      const stream = await streamingChatCompletion({
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
        }
      }

      // Save assistant response
      await supabaseAdmin.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: fullResponse,
      });

      res.write(`data: ${JSON.stringify({ content: '', done: true, sessionId: currentSessionId })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('Stream chat error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });
}

export default withAuth(handler);
