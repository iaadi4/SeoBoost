import DodoPayments from 'dodopayments'

export const dodopayments = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
  environment:
    process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
})
