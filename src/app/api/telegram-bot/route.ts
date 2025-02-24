import { NextResponse } from 'next/server';
import TelegramBot, { Update } from 'node-telegram-bot-api';
import OpenAI from 'openai';

// Basic security check for Telegram
function isValidTelegramRequest(request: Request): boolean {
  // You could add additional security checks here if needed
  return request.headers.get('content-type')?.includes('application/json') ?? false;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, {
  webHook: true
});

// Helper function to get messages from a chat
async function getMessagesSince(chatId: number, replyToMessageId: number): Promise<string[]> {
  try {
    const messages = await bot.getUpdates({
      offset: -1,
      limit: 100,
    });

    // Filter messages that are after the replied message and from the same chat
    const relevantMessages = messages
      .filter((update: Update) => {
        const msg = update.message;
        return msg && msg.chat.id === chatId && msg.message_id > replyToMessageId && msg.text;
      })
      .map((update: Update) => update.message?.text || '')
      .filter((text: string) => text.length > 0);

    return relevantMessages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Helper function to summarize text using OpenAI
async function summarizeText(text: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides concise, clear summaries of chat conversations. Focus on the key points and maintain context."
        },
        {
          role: "user",
          content: `Please summarize the following chat messages: ${text}`
        }
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'Unable to generate summary.';
  } catch (error) {
    console.error('Error summarizing text:', error);
    return 'Error generating summary.';
  }
}

export async function POST(req: Request) {
  // Basic security check
  if (!isValidTelegramRequest(req)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { message } = body;

    // Check if it's a /summarize command
    if (message?.text?.startsWith('/summarize')) {
      const chatId = message.chat.id;
      const replyToMessage = message.reply_to_message;

      // Check if the command is replying to a message
      if (!replyToMessage) {
        await bot.sendMessage(chatId, 'Please reply to a message to summarize the conversation from that point.');
        return NextResponse.json({ ok: true });
      }

      // Get messages since the replied message
      const messages = await getMessagesSince(chatId, replyToMessage.message_id);

      if (messages.length === 0) {
        await bot.sendMessage(chatId, 'No messages found to summarize.');
        return NextResponse.json({ ok: true });
      }

      // Generate summary
      const summary = await summarizeText(messages.join('\n'));

      // Send the summary back to the chat
      await bot.sendMessage(chatId, `📝 Summary:\n\n${summary}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle GET requests for webhook setup verification
export async function GET(req: Request) {
  return NextResponse.json({ ok: true });
} 