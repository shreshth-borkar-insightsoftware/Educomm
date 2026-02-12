# Stripe Webhook Setup Guide

## ✅ Code Changes Complete

The code has been updated to use Stripe webhooks for secure, server-side order creation.

## 🔧 Setup Steps

### 1. Get Your Webhook Secret

**For Local Development (using Stripe CLI):**

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to http://localhost:50135/api/payment/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`)

**For Production:**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/payment/webhook`
4. Select event: `checkout.session.completed`
5. Copy the webhook signing secret

### 2. Update appsettings.json

Add the webhook secret to your configuration:

```json
{
  "Stripe": {
    "SecretKey": "sk_test_YOUR_SECRET_KEY",
    "PublishableKey": "pk_test_YOUR_PUBLISHABLE_KEY",
    "WebhookSecret": "whsec_YOUR_WEBHOOK_SECRET"
  }
}
```

### 3. Test the Webhook

1. Start your backend server
2. Keep Stripe CLI running (if local development)
3. Complete a test payment
4. Check console logs for:
   - `[WEBHOOK] Received event: checkout.session.completed`
   - `[WEBHOOK] Order created successfully: OrderId=X`

## 🎯 What Changed

**Before (❌ Insecure):**
- Frontend created order after payment
- Could fail if user closed browser
- Vulnerable to manipulation

**After (✅ Secure):**
- Stripe sends webhook event to server when payment succeeds
- Server automatically creates order
- Works even if user loses connection
- Cannot be manipulated by client
- Production-ready and follows Stripe best practices

## 📝 Important Notes

- The webhook endpoint is **public** (no authentication required - Stripe signature verification is the security)
- Orders are now created with `Status = "Completed"` automatically by webhook
- Cart is cleared automatically after order creation
- Duplicate orders are prevented by checking for recent orders

## 🐛 Troubleshooting

If orders aren't being created:
1. Check Stripe CLI is running (for local dev)
2. Verify webhook secret in appsettings.json
3. Check server logs for webhook errors
4. Verify event type is `checkout.session.completed` in Stripe dashboard
