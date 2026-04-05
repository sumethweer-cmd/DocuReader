import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14.0.0";

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: config } = await adminSupabase.from('ai_configs').select('*').eq('is_active', true).single();
    if (!config?.stripe_secret_key) return new Response('Missing Stripe secret key', { status: 400 });

    const stripe = new Stripe(config.stripe_secret_key, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
    const payload = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;

    try {
      if (config.stripe_webhook_secret && sig) {
        event = await stripe.webhooks.constructEventAsync(payload, sig, config.stripe_webhook_secret);
      } else {
        event = JSON.parse(payload);
      }
    } catch (err) {
      console.error(`Webhook signature verification failed: ${(err as Error).message}`);
      return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, planId, tier, credits } = session.metadata || {};

      if (userId && planId && tier && credits) {
        const creditsToAdd = parseInt(credits, 10);
        
        const { data: profile } = await adminSupabase.from('profiles').select('credits').eq('id', userId).single();
        const currentCredits = profile ? profile.credits : 0;
        
        await adminSupabase.from('profiles').update({
          tier: tier.toLowerCase(),
          credits: currentCredits + creditsToAdd,
        }).eq('id', userId);

        await adminSupabase.from('transactions').insert({
          user_id: userId,
          amount: typeof session.amount_total === 'number' ? session.amount_total / 100 : 0,
          currency: session.currency || 'thb',
          status: 'completed',
          payment_method: 'stripe_checkout',
          transaction_id: session.id,
          pricing_plan_id: planId,
        });

        console.log(`Successfully upgraded user ${userId} to ${tier} with ${creditsToAdd} credits.`);
      } else {
        console.error('Missing metadata in session');
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err) {
    console.error(`Webhook Error: ${(err as Error).message}`);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
