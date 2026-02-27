import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';
import { withAuth, AuthenticatedRequest } from '../lib/middleware';
import { chatCompletion, ChatMessage } from '../lib/groq';
import { supabaseAdmin } from '../lib/supabase';

const corsMiddleware = cors({
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: '*',
});

const SYSTEM_PROMPT = `You are an AI assistant integrated with Termux, a powerful terminal emulator for Android. You have the ability to execute Termux commands and help users with their development tasks.

Capabilities:
- You can execute Termux commands when the user requests system operations
- You can help with package management (pkg, apt)
- You can assist with file operations, text editing, and scripting
- You can help with git, programming languages, and development tools
- You can run system diagnostics and provide information about the device

When executing commands:
1. Only execute commands when explicitly requested
2. Use appropriate commands for the task
3. Explain what the command does before/after execution
4. Be cautious with destructive commands (rm, sudo, etc.)

Always be helpful, concise, and accurate.`;

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { message, sessionId, executeCommand } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const userId = req.user!.userId;

      // Get or create session
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const { data: newSession, error: sessionError } = await supabaseAdmin
          .from('chat_sessions')
          .insert({
            user_id: userId,
            session_name: message.substring(0, 50) + '...',
          })
          .select('id')
          .single();

        if (sessionError) {
          throw sessionError;
        }
        currentSessionId = newSession.id;
      }

      // Get conversation history
      const { data: messages } = await supabaseAdmin
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true })
        .limit(20);

      // Build messages array for Groq
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

      // Get completion from Groq (Llama 3.3 70B)
      const response = await chatCompletion({
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const assistantMessage = response.choices[0]?.message?.content || 'Sorry, I could not process that.';

      // Save assistant response
      await supabaseAdmin.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: assistantMessage,
        token_count: response.usage?.total_tokens || 0,
      });

      return res.status(200).json({
        message: assistantMessage,
        sessionId: currentSessionId,
        model: 'llama-3.3-70b-versatile',
        usage: response.usage,
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      return res.status(500).json({
        error: 'Failed to process chat',
        details: error.message,
      });
    }
  });
}

export default withAuth(handler);
