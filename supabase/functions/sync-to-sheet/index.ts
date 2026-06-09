import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { appendToGoogleSheet } from "../_shared/google-sheets.ts";

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { template_id, data } = await req.json() as {
      template_id: string;
      data: Record<string, unknown>[];
    };

    if (!template_id) throw new Error('template_id is required');
    if (!Array.isArray(data) || data.length === 0) throw new Error('data must be a non-empty array');

    const adminSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: template, error: tplErr } = await adminSupabase
      .from('extraction_templates')
      .select('columns, google_sheet_url, user_id')
      .eq('id', template_id)
      .single();

    if (tplErr || !template) throw new Error('Template not found');
    if (template.user_id !== user.id) throw new Error('Forbidden');
    if (!template.google_sheet_url) throw new Error('Template has no Google Sheet URL configured');

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON secret not set');

    const columns = template.columns as { name: string; type: string }[];
    await appendToGoogleSheet(serviceAccountJson, template.google_sheet_url, data, columns);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
