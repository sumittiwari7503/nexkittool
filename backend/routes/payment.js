const express = require('express');
const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const db = require('../db');

const PLANS = {
  'pro-monthly': { price: 499, name: 'Nexkittool Pro Monthly' },
  'pro-annual': { price: 3999, name: 'Nexkittool Pro Annual' },
  'business-monthly': { price: 1499, name: 'Nexkittool Business Monthly' },
  'business-annual': { price: 9999, name: 'Nexkittool Business Annual' },
};

router.post('/create-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payment not configured. Add STRIPE_SECRET_KEY to .env' });
  const { plan, userId } = req.body;
  const planInfo = PLANS[plan];
  if (!planInfo) return res.status(400).json({ error: 'Invalid plan' });
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: planInfo.name }, unit_amount: planInfo.price, recurring: { interval: plan.includes('annual') ? 'year' : 'month' } }, quantity: 1 }],
      mode: 'subscription',
      success_url: process.env.BASE_URL + '/pages/dashboard.html?success=1',
      cancel_url: process.env.BASE_URL + '/pages/pricing.html?cancelled=1',
      metadata: { userId, plan }
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payment not configured. Add STRIPE_SECRET_KEY to .env' });
  const { sessionId, userId } = req.body;
  if (!sessionId || !userId) return res.status(400).json({ error: 'Session ID and User ID are required' });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const upgradedUser = await db.updateUserPlan(userId, 'pro');
      return res.json({
        ok: true,
        user: upgradedUser ? { id: upgradedUser.id, name: upgradedUser.name, email: upgradedUser.email, plan: upgradedUser.plan, verified: upgradedUser.verified } : null
      });
    } else {
      return res.status(400).json({ error: 'Payment has not been completed.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.json({ received: true });
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const { userId, plan } = event.data.object.metadata;
      console.log(`✅ Payment success: User ${userId} upgraded to ${plan}`);
      await db.updateUserPlan(userId, 'pro');
    }
    res.json({ received: true });
  } catch (err) { res.status(400).send(`Webhook Error: ${err.message}`); }
});

module.exports = router;
