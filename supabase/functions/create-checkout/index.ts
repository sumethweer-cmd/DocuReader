import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, { 
      global: { headers: { Authorization: authHeader } } 
    });
    const adminSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error(`Unauthorized: ${authError?.message || 'No user'}`);

    const { planId, returnUrl } = await req.json();
    if (!planId) throw new Error('Plan ID is required');

    const { data: plan } = await supabase.from('pricing_plans').select('*').eq('id', planId).single();
    if (!plan) throw new Error('Pricing plan not found');

    const { data: config } = await adminSupabase.from('ai_configs').select('stripe_secret_key').eq('is_active', true).single();
    if (!config?.stripe_secret_key) throw new Error('Payment gateway is not currently configured.');

    const stripe = new Stripe(config.stripe_secret_key, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });

    const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single();
    const origin = returnUrl || new URL(req.url).origin;
    const unitAmount = Math.round(plan.price_amount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'promptpay'],
      customer_email: profile?.email || user.email,
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `P-Admin - ${plan.name} Plan`,
              description: `เครดิตสำหรับใช้งาน ${plan.credits_awarded} หน้า`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?payment=canceled`,
      metadata: {
        userId: user.id,
        planId: plan.id,
        tier: plan.name,
        credits: plan.credits_awarded ? plan.credits_awarded.toString() : "0"
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
