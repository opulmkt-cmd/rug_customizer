import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { adminDb, serverTimestamp } from './_lib/firebaseAdmin';
import { shopifyAdmin, shopifyStorefront } from './_lib/shopify';

type CheckoutType = 'sample' | 'deposit';

type ConfigInput = {
  prompt?: string;
  width?: number;
  length?: number;
  construction?: string;
  materialTypes?: string[];
};

type CreateCheckoutBody = {
  type: CheckoutType;
  amount?: number;
  userId: string;
  email?: string;
  imageUrl?: string;
  config?: ConfigInput;
};

function badRequest(res: VercelResponse, message: string) {
  return res.status(400).json({ error: message });
}

function buildSummary(body: CreateCheckoutBody) {
  return {
    prompt: body.config?.prompt || '',
    size:
      body.config?.width && body.config?.length
        ? `${body.config.width} x ${body.config.length}`
        : '',
    construction: body.config?.construction || '',
    material: body.config?.materialTypes?.[0] || '',
    imageUrl: body.imageUrl || '',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as CreateCheckoutBody;

    if (!body?.type) return badRequest(res, 'Missing type');
    if (!body?.userId) return badRequest(res, 'Missing userId');

    if (body.type === 'sample' && body.amount && Number(body.amount) !== 100) {
      return badRequest(res, 'Sample amount must be 100');
    }

    if (body.type === 'deposit' && (!body.amount || Number(body.amount) <= 0)) {
      return badRequest(res, 'Deposit amount must be greater than 0');
    }

    const summary = buildSummary(body);
    const externalCheckoutId = crypto.randomUUID();
    const amount = body.type === 'sample' ? 100 : Number(body.amount);

    const orderRef = await adminDb.collection('orders').add({
      userId: body.userId,
      type: body.type === 'sample' ? 'Rug Order' : 'Deposit',
      checkoutType: body.type,
      status: 'Pending',
      paymentStatus: 'checkout_created',
      amount,
      currency: 'USD',
      paymentMethod: 'Shopify',
      config: body.config || null,
      imageUrl: body.imageUrl || null,
      email: body.email || null,
      externalCheckoutId,
      shopifyCartId: null,
      shopifyDraftOrderId: null,
      shopifyOrderId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const firestoreOrderId = orderRef.id;

    if (body.type === 'sample') {
      const sampleVariantId = process.env.SHOPIFY_SAMPLE_VARIANT_ID;
      if (!sampleVariantId) throw new Error('Missing SHOPIFY_SAMPLE_VARIANT_ID');

      const query = `
        mutation CreateCart($input: CartInput!) {
          cartCreate(input: $input) {
            cart {
              id
              checkoutUrl
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        input: {
          lines: [
            {
              quantity: 1,
              merchandiseId: sampleVariantId,
            },
          ],
          attributes: [
            { key: 'firestore_order_id', value: firestoreOrderId },
            { key: 'external_checkout_id', value: externalCheckoutId },
            { key: 'checkout_type', value: 'sample' },
            { key: 'user_id', value: body.userId },
            { key: 'prompt', value: summary.prompt.slice(0, 255) },
            { key: 'size', value: summary.size.slice(0, 255) },
            { key: 'construction', value: summary.construction.slice(0, 255) },
            { key: 'material', value: summary.material.slice(0, 255) },
            { key: 'image_url', value: summary.imageUrl.slice(0, 255) },
          ],
          buyerIdentity: body.email ? { email: body.email } : undefined,
        },
      };

      type CartCreateResponse = {
        cartCreate: {
          cart: { id: string; checkoutUrl: string } | null;
          userErrors: Array<{ field?: string[]; message: string }>;
        };
      };

      const data = await shopifyStorefront<CartCreateResponse>(query, variables);

      if (data.cartCreate.userErrors.length) {
        throw new Error(data.cartCreate.userErrors.map((e) => e.message).join(', '));
      }

      if (!data.cartCreate.cart?.checkoutUrl) {
        throw new Error('Missing Shopify checkout URL');
      }

      await orderRef.update({
        shopifyCartId: data.cartCreate.cart.id,
        shopifyCheckoutUrl: data.cartCreate.cart.checkoutUrl,
        updatedAt: serverTimestamp(),
      });

      return res.status(200).json({
        ok: true,
        type: 'sample',
        orderId: firestoreOrderId,
        checkoutUrl: data.cartCreate.cart.checkoutUrl,
      });
    }

    const query = `
      mutation DraftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            invoiceUrl
            name
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        email: body.email || undefined,
        lineItems: [
          {
            title: 'Custom Rug Deposit',
            quantity: 1,
            originalUnitPrice: amount.toFixed(2),
            requiresShipping: false,
            customAttributes: [
              { key: 'firestore_order_id', value: firestoreOrderId },
              { key: 'external_checkout_id', value: externalCheckoutId },
              { key: 'checkout_type', value: 'deposit' },
              { key: 'user_id', value: body.userId },
              { key: 'prompt', value: summary.prompt.slice(0, 255) },
              { key: 'size', value: summary.size.slice(0, 255) },
              { key: 'construction', value: summary.construction.slice(0, 255) },
              { key: 'material', value: summary.material.slice(0, 255) },
              { key: 'image_url', value: summary.imageUrl.slice(0, 255) },
            ],
          },
        ],
        customAttributes: [
          { key: 'firestore_order_id', value: firestoreOrderId },
          { key: 'external_checkout_id', value: externalCheckoutId },
          { key: 'checkout_type', value: 'deposit' },
        ],
        note: `Custom rug deposit | Firestore Order: ${firestoreOrderId}`,
      },
    };

    type DraftOrderCreateResponse = {
      draftOrderCreate: {
        draftOrder: { id: string; invoiceUrl: string; name: string } | null;
        userErrors: Array<{ field?: string[]; message: string }>;
      };
    };

    const data = await shopifyAdmin<DraftOrderCreateResponse>(query, variables);

    if (data.draftOrderCreate.userErrors.length) {
      throw new Error(data.draftOrderCreate.userErrors.map((e) => e.message).join(', '));
    }

    if (!data.draftOrderCreate.draftOrder?.invoiceUrl) {
      throw new Error('Missing Shopify invoice URL');
    }

    await orderRef.update({
      shopifyDraftOrderId: data.draftOrderCreate.draftOrder.id,
      shopifyDraftOrderName: data.draftOrderCreate.draftOrder.name,
      shopifyCheckoutUrl: data.draftOrderCreate.draftOrder.invoiceUrl,
      updatedAt: serverTimestamp(),
    });

    return res.status(200).json({
      ok: true,
      type: 'deposit',
      orderId: firestoreOrderId,
      checkoutUrl: data.draftOrderCreate.draftOrder.invoiceUrl,
    });
  } catch (error) {
    console.error('[create-checkout]', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  }
}
