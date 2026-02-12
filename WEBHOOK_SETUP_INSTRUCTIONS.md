# 🔧 Complete Webhook Setup Instructions

## Current Situation
You have 7 successful Stripe payments but no orders in your database because the webhook was never configured.

---

## Step 1: Configure Webhook in Stripe Dashboard

### For Local Development:

1. **Install Stripe CLI** (if not already installed):
   ```bash
   # Windows (using Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```
   This will open a browser to authenticate.

3. **Start forwarding webhooks to your local server**:
   ```bash
   stripe listen --forward-to http://localhost:50135/api/payment/webhook
   ```
   
   **IMPORTANT**: Keep this terminal running while testing!

4. **Copy the webhook signing secret** displayed (starts with `whsec_`).

5. **Update `appsettings.Development.json`**:
   ```json
   {
     "Stripe": {
       "SecretKey": "sk_test_...",
       "PublishableKey": "pk_test_...",
       "WebhookSecret": "whsec_YOUR_SIGNING_SECRET_HERE"
     }
   }
   ```

6. **Restart your backend** (`dotnet run` in Educomm folder).

---

### For Production:

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter webhook URL: `https://yourdomain.com/api/payment/webhook`
4. Select events to listen for:
   - ✅ `checkout.session.completed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update your **production `appsettings.json`** with this secret

---

## Step 2: Fix Historical Orders (One-Time)

Your 7 existing payments need to be converted to orders. Use this script:

### Extract Session IDs from Stripe:

From your Stripe dashboard screenshot, the payment intents are:
- `pi_3SzV0mFXtLRhQsp22duqhEpF`
- `pi_3SzfNiFXtLRhQsp20ij0de39`
- `pi_3SzE0vFXtLRhQsp22oM4tkA2`
- `pi_3SzE53FXtLRhQsp21s3wBQH`
- `pi_3SzE1aFXtLRhQsp20j5rwGef`
- `pi_3SzDt4FXtLRhQsp223ktEnj9`
- `pi_3SzDs0FXtLRhQsp20tx0McNZ`

**BUT** - You need the **Checkout Session IDs**, not Payment Intent IDs.

### Option A: Get Session IDs from Stripe CLI

```bash
# List recent successful sessions
stripe checkout sessions list --limit 10

# Or search for sessions by customer email
stripe checkout sessions list --customer-email shreshth.borkar@insightsoftware.com
```

Copy all the session IDs (format: `cs_test_...` or similar).

### Option B: Find Session IDs in Browser Console

If you saved the session IDs after checkout, check:
1. Browser developer console logs
2. Network tab → Look for calls to `/api/payment/verify-session/{sessionId}`

---

### Run the Sync Script:

Once you have the session IDs, create a file `sync-orders.http` (or use Postman):

```http
POST http://localhost:50135/api/Admin/sync-historical-payments
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: application/json

[
  "cs_test_session_id_1",
  "cs_test_session_id_2",
  "cs_test_session_id_3",
  "cs_test_session_id_4",
  "cs_test_session_id_5",
  "cs_test_session_id_6",
  "cs_test_session_id_7"
]
```

**Response will show:**
```json
{
  "totalProcessed": 7,
  "successCount": 7,
  "errorCount": 0,
  "results": [...]
}
```

---

## Step 3: Test Webhook is Working

### Test 1: Verify Endpoint is Reachable
```bash
curl http://localhost:50135/api/Admin/test-webhook-config
```

Should return:
```json
{
  "message": "Webhook endpoint is reachable",
  "endpoint": "/api/payment/webhook",
  "timestamp": "2026-02-12T..."
}
```

### Test 2: Make a Test Payment

1. **Start Stripe CLI** (in a separate terminal):
   ```bash
   stripe listen --forward-to http://localhost:50135/api/payment/webhook
   ```

2. **Complete a test payment** in your frontend.

3. **Watch the Stripe CLI terminal** - you should see:
   ```
   --> checkout.session.completed [evt_xxx]
   <-- [200] POST http://localhost:50135/api/payment/webhook [evt_xxx]
   ```

4. **Check your backend logs** for:
   ```
   [WEBHOOK] Received event: checkout.session.completed
   [WEBHOOK] Processing completed session: cs_test_...
   [ORDER CREATE] Order created successfully: OrderId=X
   ```

5. **Verify in your app** - Go to "My Orders" and the new order should appear immediately!

---

## Step 4: Verify Everything Works

### Checklist:
- ✅ Stripe CLI is running (`stripe listen`)
- ✅ Backend shows `[WEBHOOK] Received event` in console
- ✅ Orders appear in "My Orders" page immediately after payment
- ✅ Cart is cleared after successful payment
- ✅ Historical orders from Step 2 are now visible

---

## Troubleshooting

### Orders Still Not Showing?

1. **Check if webhook is being called:**
   - Look at Stripe CLI output
   - Check backend console for `[WEBHOOK]` logs

2. **Check database:**
   ```sql
   SELECT * FROM Orders WHERE UserId = YOUR_USER_ID;
   ```

3. **Check if fallback is working:**
   - Backend logs should show `[VERIFY] No order found - webhook might have failed. Creating order as fallback.`

### Webhook Not Being Called?

1. **Is Stripe CLI running?**
   ```bash
   stripe listen --forward-to http://localhost:50135/api/payment/webhook
   ```

2. **Is backend running on correct port?**
   - Check `launchSettings.json` for the actual port
   - Update webhook URL if needed

3. **Is WebhookSecret correct?**
   - Check `appsettings.Development.json`
   - Should match the secret from `stripe listen` output

---

## Production Deployment Checklist

Before deploying to production:

1. ✅ Add webhook endpoint in Stripe Dashboard (production mode)
2. ✅ Copy production webhook secret to production `appsettings.json`
3. ✅ Update `SuccessUrl` and `CancelUrl` in PaymentController to production URLs
4. ✅ Test end-to-end payment flow in production
5. ✅ Monitor webhook delivery in Stripe Dashboard → Webhooks → [Your endpoint]

---

## Need Help?

If orders still aren't showing:
1. Share the Stripe CLI output
2. Share backend console logs (look for `[WEBHOOK]` and `[VERIFY]` messages)
3. Confirm if you have session IDs or only payment intent IDs
