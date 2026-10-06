import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory lock & packed state registry to prevent race conditions / duplicate packing
  const packedOrderRegistry = new Map<string, { packedAt: string; packedBy: string }>();
  const activePackingLocks = new Set<string>();

  /**
   * POST /api/orders/confirm-and-pack
   * Production-ready "Confirm & Pack" endpoint.
   * Prevents duplicate packing, sets Order Status = Packed, records Packed At & Packed By.
   */
  app.post('/api/orders/confirm-and-pack', async (req, res) => {
    const { orderId, packedBy, currentStatus } = req.body || {};
    const cleanOrderId = String(orderId || '').trim();
    const cleanPackedBy = String(packedBy || 'Admin').trim();

    if (!cleanOrderId) {
      res.status(400).json({
        success: false,
        message: 'Order not found',
      });
      return;
    }

    // Prevent concurrent double-clicks / race conditions
    if (activePackingLocks.has(cleanOrderId)) {
      res.status(200).json({
        success: false,
        code: 'ALREADY_PACKED',
        message: 'This order is currently being packed by another staff member.',
      });
      return;
    }

    const statusLower = String(currentStatus || '').toLowerCase();
    if (
      packedOrderRegistry.has(cleanOrderId) ||
      statusLower === 'packed' ||
      statusLower.includes('បានវិចខ្ចប់')
    ) {
      res.status(200).json({
        success: false,
        code: 'ALREADY_PACKED',
        message: 'This order has already been packed.',
      });
      return;
    }

    activePackingLocks.add(cleanOrderId);
    try {
      const now = new Date();
      const packedAt = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 8)}`;
      packedOrderRegistry.set(cleanOrderId, { packedAt, packedBy: cleanPackedBy });

      res.status(200).json({
        success: true,
        message: 'Order packed successfully',
        orderId: cleanOrderId,
        status: 'Packed',
        packedAt,
        packedBy: cleanPackedBy,
      });
    } finally {
      activePackingLocks.delete(cleanOrderId);
    }
  });

  /**
   * GET /api/telegram/status
   * Returns whether TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are configured on the server
   * (without ever exposing the raw bot token to the client).
   */
  app.get('/api/telegram/status', (_req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = process.env.TELEGRAM_CHAT_ID || '';
    const configured = Boolean(token.trim() && chatId.trim());
    const maskedChatId = chatId
      ? chatId.length > 5
        ? `${chatId.slice(0, 4)}***${chatId.slice(-3)}`
        : chatId
      : 'Not Configured';

    res.json({
      configured,
      maskedChatId,
    });
  });

  /**
   * POST /api/telegram/notify
   * Sends a real message via the Telegram Bot API using server-side credentials,
   * including inline_keyboard buttons to Confirm Order in Telegram Bot and Open Customer Chat.
   */
  app.post('/api/telegram/notify', async (req, res) => {
    const startTime = Date.now();
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();
    const { message, event, orderId, customerTelegramUrl, replyMarkup } = req.body || {};

    if (!message) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        latencyMs: Date.now() - startTime,
        errorReason: 'Missing notification message payload.',
      });
      return;
    }

    // Build default Telegram inline_keyboard if customerTelegramUrl is provided
    let finalReplyMarkup = replyMarkup;
    if (!finalReplyMarkup && customerTelegramUrl) {
      finalReplyMarkup = {
        inline_keyboard: [
          [
            {
              text: '💬 ទាក់ទងអតិថិជនតាម Telegram',
              url: customerTelegramUrl,
            },
          ],
        ],
      };
    }

    if (!token || !chatId) {
      res.status(200).json({
        success: true,
        simulated: true,
        statusCode: 200,
        latencyMs: Date.now() - startTime,
        deliveredTo: 'Simulated Mode (Set TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID in Secrets)',
        event: event || 'NOTIFICATION',
      });
      return;
    }

    try {
      const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      const tgPayload: Record<string, unknown> = {
        chat_id: chatId,
        text: message,
      };
      if (finalReplyMarkup) {
        tgPayload.reply_markup = finalReplyMarkup;
      }

      const tgRes = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tgPayload),
      });

      const data = (await tgRes.json()) as { ok?: boolean; description?: string };
      const latencyMs = Date.now() - startTime;

      if (!tgRes.ok || !data.ok) {
        res.status(200).json({
          success: false,
          simulated: false,
          statusCode: tgRes.status || 400,
          latencyMs,
          deliveredTo: `Telegram Chat (${chatId})`,
          errorReason: data.description || `Telegram HTTP ${tgRes.status}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        simulated: false,
        statusCode: 200,
        latencyMs,
        deliveredTo: `Telegram Chat (${chatId})`,
      });
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errMsg = err instanceof Error ? err.message : 'Network error calling Telegram API';
      res.status(200).json({
        success: false,
        simulated: false,
        statusCode: 500,
        latencyMs,
        deliveredTo: `Telegram Chat (${chatId})`,
        errorReason: errMsg,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SN STORE Server running on http://localhost:${PORT}`);
  });
}

startServer();
