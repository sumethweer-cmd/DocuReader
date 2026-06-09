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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized: ' + (authError?.message || 'No user'));

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const textContent = formData.get('text_content') as string | null;
    const templateId = formData.get('template_id') as string;
    let pageCountInput = Number(formData.get('page_count') || '1');
    let creditsToDeduct = pageCountInput;

    if (!file && !textContent) throw new Error('No file or text content provided');

    if (textContent && !file) {
      const words = textContent.trim().split(/\s+/).length;
      creditsToDeduct = Math.ceil(words / 300) * 2;
    }

    // Check credits
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    if (!profile || profile.credits < creditsToDeduct) {
      return new Response(JSON.stringify({ error: 'เครดิตไม่เพียงพอ', credits: profile?.credits || 0, required: creditsToDeduct }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get active AI config
    const adminSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: aiConfig } = await adminSupabase.from('ai_configs').select('*').eq('is_active', true).single();
    if (!aiConfig?.api_key) throw new Error('AI model not configured. Please set API key in admin panel.');

    // Get template details
    let columnsPrompt = '';
    let customAiInstruction = '';
    let webhookUrl = '';
    let headerRowIndex = 1;
    let googleSheetUrl = '';
    let templateColumns: { name: string; type: string }[] = [];
    if (templateId) {
      const { data: template } = await adminSupabase.from('extraction_templates').select('columns, custom_prompt, webhook_url, header_row_index, google_sheet_url').eq('id', templateId).single();
      if (template?.columns) {
        const cols = template.columns as { name: string; type: string; format?: string }[];
        templateColumns = cols;
        const aiCols = cols.filter((c) => c.type !== 'sequence');
        columnsPrompt = 'Extract ONLY these fields from the content:\\n' +
                        aiCols.map((c) => '- \"' + c.name + '\" (type: ' + c.type + ')').join('\\n') +
                        '\\n\\nReturn the data as a JSON array of objects with these exact field names as keys.';
      }
      if (template?.custom_prompt) {
        customAiInstruction = '\\n\\nUSER CUSTOM INSTRUCTIONS (FOLLOW STRICTLY):\\n' + template.custom_prompt + '\\n';
      }
      if (template?.webhook_url) {
        webhookUrl = template.webhook_url;
      }
      if (template?.header_row_index) {
        headerRowIndex = template.header_row_index;
      }
      if (template?.google_sheet_url) {
        googleSheetUrl = template.google_sheet_url;
      }
    }
    if (!columnsPrompt) columnsPrompt = 'Extract all key information from this content as a JSON array of objects.';

    // Prepare Gemini Content
    const geminiContentParts: any[] = [];
    let fileName = '';
    let fileSize = 0;

    if (file) {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      fileName = `${user.id}/${timestamp}-${safeName}`;
      fileSize = file.size;
      await adminSupabase.storage.from('documents').upload(fileName, file);

      const fileBytes = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBytes);
      let binaryString = '';
      const chunkSize = 8000;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        binaryString += String.fromCharCode.apply(null, Array.from(uint8Array.subarray(i, i + chunkSize)));
      }
      const base64 = btoa(binaryString);
      geminiContentParts.push({ inline_data: { mime_type: file.type || 'application/pdf', data: base64 } });
    } else if (textContent) {
      fileName = user.id + '/text-' + Date.now() + '.txt';
      fileSize = textContent.length;
      await adminSupabase.storage.from('documents').upload(fileName, new Blob([textContent]));
      geminiContentParts.push({ text: 'Content to extract from:\\n\"\"\"\\n' + textContent + '\\n\"\"\"' });
    }

    geminiContentParts.push({
      text: 'You are a document data extraction AI. ' + columnsPrompt + customAiInstruction +
            '\\n\\nIMPORTANT RULES:\\n1. Return ONLY valid JSON array. No markdown fences, no explanation.\\n2. Each item in the array is one record/row.\\n3. Use the exact field names specified.\\n4. If a field is not found, use null.\\n5. For currency/number types, return numeric values without currency symbols.'
    });

    // Call Gemini API
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + aiConfig.model_name + ':generateContent?key=' + aiConfig.api_key;
    const geminiReq = {
      contents: [{ parts: geminiContentParts }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiReq)
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error('Gemini API error: ' + errText);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0;

    // Parse JSON from response
    let extractedData;
    try {
      let cleanText = rawText.trim();
      if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      extractedData = JSON.parse(cleanText.trim());
    } catch {
      try {
        const arrayStart = rawText.indexOf('[');
        const arrayEnd = rawText.lastIndexOf(']');
        if (arrayStart !== -1 && arrayEnd > arrayStart) {
          extractedData = JSON.parse(rawText.substring(arrayStart, arrayEnd + 1));
        } else {
          const objStart = rawText.indexOf('{');
          const objEnd = rawText.lastIndexOf('}');
          if (objStart !== -1 && objEnd > objStart) {
            extractedData = JSON.parse(rawText.substring(objStart, objEnd + 1));
          } else {
            extractedData = [{ raw_text: rawText }];
          }
        }
      } catch { extractedData = [{ raw_text: rawText }]; }
    }
    if (!Array.isArray(extractedData)) extractedData = [extractedData];

    // Deduct credits
    await adminSupabase.from('profiles').update({ credits: profile.credits - creditsToDeduct }).eq('id', user.id);

    // Save document record
    const { data: doc, error: docError } = await supabase.from('documents').insert({
      user_id: user.id,
      filename: file ? file.name : 'Text Input',
      original_filename: file ? file.name : 'Text Input',
      status: 'completed',
      data: extractedData,
      page_count: creditsToDeduct,
      file_size: fileSize,
      storage_path: fileName,
      template_id: templateId || null
    }).select().single();

    if (docError) console.error('Save doc error:', docError);

    // Log usage
    await adminSupabase.from('usage_logs').insert({
      user_id: user.id, model_name: aiConfig.model_name,
      tokens_used: tokensUsed, action_type: 'extraction'
    });

    // --- TRIGGER WEBHOOK IF PRESENT ---
    if (webhookUrl && doc) {
      try {
        // We push the data to the webhook
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'document.processed',
            timestamp: new Date().toISOString(),
            document_id: doc.id,
            filename: doc.original_filename,
            header_row: headerRowIndex,
            data: extractedData
          })
        });
      } catch (webhookErr) {
        console.error('Webhook failed:', webhookErr);
      }
    }

    // --- SYNC TO GOOGLE SHEET IF CONFIGURED ---
    let sheetSynced = false;
    let sheetError = '';
    if (googleSheetUrl && templateColumns.length > 0) {
      try {
        const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
        if (!serviceAccountJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON secret not set');
        await appendToGoogleSheet(serviceAccountJson, googleSheetUrl, extractedData, templateColumns);
        sheetSynced = true;
      } catch (sheetErr) {
        sheetError = (sheetErr as Error).message;
        console.error('Sheet sync failed:', sheetError);
      }
    }

    return new Response(JSON.stringify({
      success: true, document: doc, extracted_data: extractedData,
      credits_used: creditsToDeduct, credits_remaining: profile.credits - creditsToDeduct, tokens_used: tokensUsed,
      sheet_synced: sheetSynced, sheet_error: sheetError || undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});