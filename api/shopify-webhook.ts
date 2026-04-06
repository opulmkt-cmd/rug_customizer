import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import getRawBody from 'raw-body';
import { adminDb, serverTimestamp } from './_lib/firebaseAdmin';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function verifyShopifyWebhook(req: VercelRequest, rawBody: Buffer) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) throw new Error('Missing SHOPIFY_WEBHOOK_SECRET');

  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  if (!hmacHeader || Array.isArray(hmacHeader)) return false;

  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  const digestBuffer = Buffer.from(digest, 'utf8');
  const headerBuffer = Buffer.from(hmacHeader, 'utf8');

  if (digestBuffer.length !== headerBuffer.length) return false;
  return crypto.timingSafeEqual(digestBuffer, headerBuffer);
}

function extractFirestoreOrderId(order: any): string | null {
  const noteAttributes = Array.isArray(order?.note_attributes) ? order.note_attributes : [];
  for (const attr of noteAttributes) {
    if (attr?.name === 'firestore_order_id' && attr?.value) {
      return String(attr.value);
    }
  }

  const note = typeof order?.note === 'string' ? order.note : '';
  const match = note.match(/Firestore Order:\s*([A-Za-z0-9_-]+)/i);
  return match?.[1] || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method not allowed');
  }

  try {
    const rawBody = await getRawBody(req);
    const isValid = await verifyShopifyWebhook(req, rawBody);

    if (!isValid) {
      return res.status(401).send('Invalid webhook signature');
    }

    const topic = req.headers['x-shopify-topic'];
    const payload = JSON.parse(rawBody.toString('utf8'));

    if (topic === 'orders/create' || topic === 'orders/paid') {
      const firestoreOrderId = extractFirestoreOrderId(payload);

      if (firestoreOrderId) {
        const update: Record<string, unknown> = {
          shopifyOrderId: String(payload.id),
          shopifyOrderName: payload.name || null,
          updatedAt: serverTimestamp(),
        };

        if (topic === 'orders/create') {
          update.status = 'Processing';
          update.paymentStatus = payload.financial_status || 'created';
        }

        if (topic === 'orders/paid') {
          update.status = 'Paid';
          update.paymentStatus = 'paid';
          update.paidAt = serverTimestamp();
        }

        await adminDb.collection('orders').doc(firestoreOrderId).set(update, { merge: true });
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[shopify-webhook]', error);
    return res.status(500).send('Webhook failed');
  }
}
