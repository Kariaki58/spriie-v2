# Flutterwave Webhook Setup Guide

## Overview
This application uses Flutterwave webhooks to ensure all transactions are properly tracked and wallet balances are updated, even if transactions take a long time to process.

## Webhook Endpoint
**URL:** `https://your-domain.com/api/wallet/webhook`

## Environment Variables Required

Add these to your `.env.local` file:

```env
FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key
FLUTTERWAVE_SECRET_HASH=your_secret_hash  # For webhook verification
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Your production URL
```

## Setting Up Webhook in Flutterwave Dashboard

1. Log in to your Flutterwave Dashboard
2. Go to **Settings** → **Webhooks**
3. Add a new webhook with the following details:
   - **Webhook URL:** `https://your-domain.com/api/wallet/webhook`
   - **Events to listen to:**
     - `charge.completed` - Payment successful
     - `charge.failed` - Payment failed
     - `transfer.completed` - Transfer successful
     - `transfer.failed` - Transfer failed
     - `transfer.reversed` - Transfer reversed
4. Copy the **Secret Hash** and add it to your `.env.local` as `FLUTTERWAVE_SECRET_HASH`

## How It Works

### Payment/Funding Flow:
1. User initiates payment → Transaction created with status "pending"
2. User completes payment on Flutterwave
3. Flutterwave sends webhook to `/api/wallet/webhook`
4. Webhook handler:
   - Verifies webhook signature
   - Updates transaction status to "successful"
   - Updates wallet balance (available + ledger)

### Withdrawal Flow:
1. User initiates withdrawal → Transaction created, available balance deducted
2. Flutterwave processes transfer
3. Flutterwave sends webhook to `/api/wallet/webhook`
4. Webhook handler:
   - Verifies webhook signature
   - Updates transaction status
   - Updates wallet ledger balance
   - If failed, refunds available balance

## Webhook Security

The webhook handler verifies the `verif-hash` header against `FLUTTERWAVE_SECRET_HASH` to ensure requests are from Flutterwave.

## Idempotency

The webhook handler is idempotent - it checks transaction status before updating, so duplicate webhooks won't cause issues.

## Testing

You can test webhooks using Flutterwave's webhook testing tool or by using their sandbox environment.

## Monitoring

All webhook events are logged to the console. Check your server logs to monitor webhook processing.

