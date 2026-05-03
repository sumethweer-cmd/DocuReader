'use strict';
const fs = require('fs');

// ─── Constants ────────────────────────────────────────────────────────────────
const SB_URL = 'https://sdnghecdrsukdgbxsjfl.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbmdoZWNkcnN1a2RnYnhzamZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI5MTE5OSwiZXhwIjoyMDkwODY3MTk5fQ.sxfUuKto0yD9YUGszS2SO89GB6ccbbh3KGmOWOyW4t4';
const LINE_TOKEN = 'Bearer tM/N7+bK3B7ilg01vTz8I31ikjIr5ipbacL8+1m2mm3DZoHUFxeGThmjesjl953BsMCBoj3Lml0HLJ2+b3WgTFZPPm5UhyohZMFmgCC0OghO9EjfqGn78hsRc4jnH7nKkwd8Zb/VythuDydiOX/v4wdB04t89/1O/w1cDnyilFU=';
const WEBAPP_URL = 'https://docu-reader-alpha.vercel.app';
const REST = SB_URL + '/rest/v1';
const EDGE = SB_URL + '/functions/v1';
const LINE_REPLY = 'https://api.line.me/v2/bot/message/reply';
const LINE_PUSH  = 'https://api.line.me/v2/bot/message/push';

// ─── Helper functions ─────────────────────────────────────────────────────────
function sbH(extra) {
  const p = [{ name: 'apikey', value: SB_KEY }, { name: 'Authorization', value: 'Bearer ' + SB_KEY }];
  if (extra) extra.forEach(e => p.push(e));
  return { parameters: p };
}
function sbPostH() { return sbH([{ name: 'Content-Type', value: 'application/json' }]); }
function sbPatchH() { return sbH([{ name: 'Content-Type', value: 'application/json' }, { name: 'Prefer', value: 'return=minimal' }]); }
function lineH() { return { parameters: [{ name: 'Authorization', value: LINE_TOKEN }, { name: 'Content-Type', value: 'application/json' }] }; }
function edgeH() { return { parameters: [{ name: 'Authorization', value: 'Bearer ' + SB_KEY }, { name: 'Content-Type', value: 'application/json' }] }; }

function get(id, name, url, pos) {
  return { parameters: { method: 'GET', url, sendHeaders: true, headerParameters: sbH(), options: {} }, alwaysOutputData: true, id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4, position: pos };
}
function post(id, name, url, headers, body, pos, opts) {
  return { parameters: { method: 'POST', url, sendHeaders: true, headerParameters: headers, sendBody: true, specifyBody: 'json', jsonBody: body, options: opts || {} }, id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4, position: pos };
}
function postEdge(id, name, url, body, pos) {
  return { parameters: { method: 'POST', url, sendHeaders: true, headerParameters: edgeH(), sendBody: true, specifyBody: 'json', jsonBody: body, options: { timeout: 60000 } }, id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4, position: pos };
}
function rpc(id, name, url, body, pos) {
  return { parameters: { method: 'POST', url, sendHeaders: true, headerParameters: sbPostH(), sendBody: true, specifyBody: 'json', jsonBody: body, options: {} }, alwaysOutputData: true, id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4, position: pos };
}
function patchSb(id, name, url, body, pos) {
  return { parameters: { method: 'PATCH', url, sendHeaders: true, headerParameters: sbPatchH(), sendBody: true, specifyBody: 'json', jsonBody: body, options: {} }, id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4, position: pos };
}
function del(id, name, url, pos) {
  return { parameters: { method: 'DELETE', url, sendHeaders: true, headerParameters: sbH(), options: {} }, id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4, position: pos };
}
function code(id, name, jsCode, pos) {
  return { parameters: { jsCode }, id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position: pos };
}
function ifNode(id, name, val1, op, val2, pos) {
  return { parameters: { conditions: { boolean: [{ value1: val1, operation: op || 'equal', value2: val2 }] } }, id, name, type: 'n8n-nodes-base.if', typeVersion: 1, position: pos };
}
function ifStr(id, name, val1, op, val2, pos) {
  return { parameters: { conditions: { string: [{ value1: val1, operation: op || 'equal', value2: val2 }] } }, id, name, type: 'n8n-nodes-base.if', typeVersion: 1, position: pos };
}
function sw(id, name, val1, cases, pos, fallback) {
  return { parameters: { dataType: 'string', value1: val1, rules: { rules: cases.map((c, i) => ({ value2: c, output: i })) }, fallbackOutput: fallback || 'none' }, id, name, type: 'n8n-nodes-base.switch', typeVersion: 1, position: pos };
}

// ─── Reusable Flex templates ──────────────────────────────────────────────────
const NOT_REG_FLEX = JSON.stringify({ type: 'flex', altText: 'ยังไม่ได้เชื่อมบัญชี', contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [{ type: 'text', text: '🔐 ยังไม่ได้เชื่อมบัญชี', weight: 'bold', size: 'lg' }, { type: 'text', text: 'สมัครใช้งานที่ webapp แล้วเชื่อม Line account ในหน้าทีมได้เลยครับ', wrap: true, color: '#555555', size: 'sm' }] }, footer: { type: 'box', layout: 'vertical', contents: [{ type: 'button', action: { type: 'uri', label: '🚀 สมัคร / เข้าสู่ระบบ', uri: WEBAPP_URL }, style: 'primary', color: '#4F46E5' }] } } });
const NO_CREDITS_FLEX = JSON.stringify({ type: 'flex', altText: 'เครดิตหมดแล้ว', contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [{ type: 'text', text: '⚠️ เครดิตหมดแล้ว', weight: 'bold', size: 'lg', color: '#DC2626' }, { type: 'text', text: 'เติมเครดิตเพื่อใช้งานต่อได้เลยครับ', wrap: true, color: '#555555', size: 'sm' }] }, footer: { type: 'box', layout: 'vertical', contents: [{ type: 'button', action: { type: 'uri', label: '💳 เติมเครดิต', uri: WEBAPP_URL }, style: 'primary', color: '#DC2626' }] } } });
const NO_TEMPLATES_FLEX = JSON.stringify({ type: 'flex', altText: 'ยังไม่มี Template', contents: { type: 'bubble', body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [{ type: 'text', text: '🔧 ยังไม่มี Template', weight: 'bold', size: 'lg' }, { type: 'text', text: 'สร้าง Template ก่อนได้เลยครับ\nพิมพ์ "สร้าง template" แล้วผมจะช่วยสร้างให้ หรือสร้างได้ที่ webapp', wrap: true, color: '#555555', size: 'sm' }] }, footer: { type: 'box', layout: 'vertical', contents: [{ type: 'button', action: { type: 'uri', label: '⚙️ สร้างที่ webapp', uri: WEBAPP_URL }, style: 'primary', color: '#4F46E5' }] } } });
const WELCOME_FLEX = JSON.stringify({ type: 'flex', altText: 'ยินดีต้อนรับสู่ P-Admin!', contents: { type: 'bubble', hero: { type: 'box', layout: 'vertical', paddingAll: '20px', contents: [{ type: 'text', text: '👋 สวัสดีครับ!', weight: 'bold', size: 'xxl', align: 'center' }, { type: 'text', text: 'ผม พี่แอดมิน — AI แปลงเอกสารเป็นข้อมูล', wrap: true, align: 'center', color: '#555555', size: 'sm', margin: 'sm' }] }, body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [{ type: 'text', text: '📋 ทำอะไรได้บ้าง?', weight: 'bold', size: 'md' }, { type: 'text', text: '• ส่งรูปเอกสาร → ได้ข้อมูลกลับทันที\n• รองรับใบเสร็จ, invoice, ออเดอร์ ฯลฯ\n• Export CSV และ sync Google Sheet\n• พิมพ์ "สร้าง template" ให้ AI สร้างให้อัตโนมัติ', wrap: true, color: '#555555', size: 'sm' }] }, footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [{ type: 'button', action: { type: 'uri', label: '🚀 สมัคร / เข้าสู่ระบบ', uri: WEBAPP_URL }, style: 'primary', color: '#4F46E5' }] } } });

// ─── Code snippets ────────────────────────────────────────────────────────────

const extractEventCode =
`const body = $input.first().json.body || $input.first().json;
const event = (body.events || [])[0];
if (!event) return [];
const src = event.source || {};
return [{ json: {
  type: event.type,
  replyToken: event.replyToken || null,
  userId: src.userId || null,
  groupId: src.groupId || null,
  sourceType: src.type || 'user',
  messageType: event.message ? event.message.type : null,
  messageId: event.message ? event.message.id : null,
  messageText: event.message ? event.message.text : null,
  fileName: event.message ? (event.message.fileName || null) : null,
  postbackData: event.postback ? event.postback.data : null,
  linkResult: event.link ? event.link.result : null,
  linkNonce:  event.link ? event.link.nonce : null,
} }];`;

const parsePostbackCode =
`const event = $input.first().json;
const params = new URLSearchParams(event.postbackData || '');
const action = params.get('action') || '';
const templateId = params.get('template_id');
return [{ json: {
  ...event,
  pbAction: action,
  templateId: (templateId === 'auto' || !templateId) ? null : templateId,
} }];`;

// ── POSTBACK: select_template ─────────────────────────────────────────────────

const pbMergePendingCode =
`const pb = $('Parse Postback').first().json;
const rows = $input.first()?.json ?? null;
const pending = Array.isArray(rows) ? rows[0] || null : (rows && rows.job_type ? rows : null);
return [{ json: { ...pb, pending, pendingFound: !!pending } }];`;

const pbFormatResultCode =
`const pb = $('PB: Pending Found?').first().json;
const result = $input.first().json;
if (!result.success) {
  const errMap = { insufficient_credits: 'เครดิตไม่เพียงพอ\\nกรุณาเติมเครดิตที่ webapp', org_not_found: 'ไม่พบข้อมูลองค์กร' };
  const msg = errMap[result.error] || ('เกิดข้อผิดพลาด: ' + result.error);
  return [{ json: { userId: pb.userId, isError: true, errorText: msg } }];
}
const data = result.extracted_data || [];
if (data.length === 0) return [{ json: { userId: pb.userId, isError: true, errorText: 'ไม่พบข้อมูลในเอกสาร' } }];
const lines = [];
data.forEach(function(row, i) {
  if (data.length > 1) lines.push('รายการที่ ' + (i+1));
  Object.keys(row).forEach(function(k) { if (row[k] !== null && row[k] !== undefined && row[k] !== '') lines.push('• ' + k + ': ' + row[k]); });
});
const summaryText = (result.template_name || 'เอกสาร') + ' | ' + data.length + ' รายการ\\nเครดิตคงเหลือ: ' + result.credits_remaining;
const footerBtns = [];
if (result.google_sheet_url) footerBtns.push({ type: 'button', action: { type: 'uri', label: '📊 ดูใน Google Sheet', uri: result.google_sheet_url }, style: 'primary', color: '#34A853' });
if (result.csv_url) footerBtns.push({ type: 'button', action: { type: 'uri', label: '📥 ดาวน์โหลด CSV', uri: result.csv_url }, style: 'secondary' });
const bodyContents = [
  { type: 'text', text: '✅ แปลงข้อมูลแล้ว', weight: 'bold', size: 'lg', color: '#16A34A' },
  { type: 'text', text: summaryText, wrap: true, size: 'sm', color: '#555555' },
  { type: 'separator', margin: 'md' },
  { type: 'text', text: lines.slice(0, 20).join('\\n'), wrap: true, size: 'sm', margin: 'md' },
];
const flexContents = { type: 'bubble', body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: bodyContents } };
if (footerBtns.length > 0) flexContents.footer = { type: 'box', layout: 'vertical', spacing: 'sm', contents: footerBtns };
return [{ json: { userId: pb.userId, isError: false, flexMsg: { type: 'flex', altText: '✅ ' + (result.template_name || 'เอกสาร') + ' — ' + data.length + ' รายการ', contents: flexContents } } }];`;

// ── POSTBACK: template_confirm ────────────────────────────────────────────────

const pbTplMergeCode =
`const pb = $('Parse Postback').first().json;
const rows = $input.first()?.json ?? null;
const pending = Array.isArray(rows) ? rows[0] || null : (rows && rows.job_type ? rows : null);
const found = !!pending;
const meta = (pending && pending.metadata) ? pending.metadata : {};
const draft = meta.draft || null;
return [{ json: {
  ...pb,
  pending,
  pendingFound: found,
  draft,
  tplOwnerId: meta.owner_id || null,
  tplName: draft ? draft.name : '',
  tplColumns: draft ? draft.columns : [],
  tplPrompt: draft ? (draft.custom_prompt || '') : '',
} }];`;

// ── POSTBACK: skip_image ──────────────────────────────────────────────────────

const pbSkipMergeCode =
`const pb = $('Parse Postback').first().json;
const rows = $input.first()?.json ?? null;
const pending = Array.isArray(rows) ? rows[0] || null : (rows && rows.job_type ? rows : null);
const meta = (pending && pending.metadata) ? pending.metadata : {};
const updated = JSON.stringify({ step: 2, metadata: { ...meta, image_skipped: true } });
return [{ json: { ...pb, pending, patchBody: updated } }];`;

// ── IMAGE flow ────────────────────────────────────────────────────────────────

const imgMergeOrgCode =
`const event = $('Extract Event').first().json;
const rows = $input.first()?.json ?? null;
const org = Array.isArray(rows) ? rows[0] || null : (rows && rows.org_id ? rows : null);
return [{ json: { ...event, org, orgFound: !!org } }];`;

const imgClassifyCode =
`const ctx = $('IMG: Merge Org').first().json;
const rows = $input.first()?.json ?? null;
const pending = Array.isArray(rows) ? rows[0] || null : (rows && rows.job_type ? rows : null);
let state = 'proceed';
if (pending) {
  const meta = pending.metadata || {};
  if (pending.job_type === 'template_creation' && (pending.step || 0) === 1) {
    state = 'template_step1';
  } else if (pending.job_type === 'extraction') {
    const ageMs = Date.now() - new Date(pending.created_at).getTime();
    if (ageMs < 30 * 60 * 1000) state = 'extraction_lock';
  }
}
return [{ json: { ...ctx, pending, state } }];`;

const imgTpl1PrepareCode =
`const ctx = $input.first().json;
const meta = (ctx.pending && ctx.pending.metadata) ? ctx.pending.metadata : {};
const updatedMeta = { ...meta, image_message_id: ctx.messageId };
return [{ json: { ...ctx, patchBody: JSON.stringify({ step: 2, metadata: updatedMeta }) } }];`;

const imgLockBuildCode =
`const ctx = $('IMG: Classify State').first().json;
const templates = $input.first().json;
const items = (Array.isArray(templates) ? templates : []).map(t => ({
  type: 'action',
  action: { type: 'postback', label: t.name.slice(0, 20), data: 'action=select_template&template_id=' + t.id, displayText: t.name },
}));
items.unshift({ type: 'action', action: { type: 'postback', label: 'Auto Detect', data: 'action=select_template&template_id=auto', displayText: 'Auto Detect' } });
const msg = {
  replyToken: ctx.replyToken,
  messages: [{ type: 'text', text: '⚠️ มีเอกสารค้างอยู่ครับ\\nกรุณาเลือก Template ก่อนนะครับ', quickReply: { items: items.slice(0, 13) } }],
};
return [{ json: { ...ctx, lineMessage: msg } }];`;

const imgProcClassifyTplsCode =
`const ctx = $('IMG: Classify State').first().json;
const templates = $input.first().json;
const list = Array.isArray(templates) ? templates : [];
const items = list.map(t => ({
  type: 'action',
  action: { type: 'postback', label: t.name.slice(0, 20), data: 'action=select_template&template_id=' + t.id, displayText: t.name },
}));
items.unshift({ type: 'action', action: { type: 'postback', label: 'Auto Detect', data: 'action=select_template&template_id=auto', displayText: 'Auto Detect' } });
const lineMessage = {
  replyToken: ctx.replyToken,
  messages: [{ type: 'text', text: 'ได้รับเอกสารแล้วครับ\\nเลือก Template:', quickReply: { items: items.slice(0, 13) } }],
};
return [{ json: { ...ctx, templates: list, hasTemplates: list.length > 0, lineMessage } }];`;

// ── TEXT flow ─────────────────────────────────────────────────────────────────

const txtClassifyCode =
`const event = $('Extract Event').first().json;
const orgRows = $('TXT: Resolve Org').first()?.json ?? null;
const pendingRows = $input.first()?.json ?? null;
const org = Array.isArray(orgRows) ? orgRows[0] || null : (orgRows && orgRows.org_id ? orgRows : null);
const pending = Array.isArray(pendingRows) ? pendingRows[0] || null : (pendingRows && pendingRows.job_type ? pendingRows : null);
const text = (event.messageText || '').trim().toLowerCase();

let state = 'fallback';

if (pending && pending.job_type === 'template_creation') {
  const step = pending.step || 0;
  if (step === 2) state = 'template_step2';
}

if (state === 'fallback') {
  const templateCmds = ['สร้าง template', 'สร้างtemplate', 'new template', 'template ใหม่', 'templateใหม่', 'create template', 'สร้างtemplate'];
  if (templateCmds.some(kw => text.includes(kw))) state = 'template_command';
}

if (state === 'fallback') {
  if (text === 'เครดิต' || text === 'credit' || text === 'credits' || text.includes('เครดิตคงเหลือ')) state = 'credits_query';
}

// Unregistered user checking credits → show account link button
// fallback text goes to AI Agent so unregistered users can still ask questions
if (state === 'credits_query' && !org) {
  state = 'not_registered';
}

return [{ json: { ...event, org, orgFound: !!org, pending, state, credits: org ? org.credits : null } }];`;

const txtStep2PrepareCode =
`const ctx = $input.first().json;
const meta = (ctx.pending && ctx.pending.metadata) ? ctx.pending.metadata : {};
const reqBody = JSON.stringify({
  org_id: ctx.org.org_id,
  owner_id: meta.owner_id || ctx.org.owner_id,
  line_message_id: meta.image_message_id || undefined,
  user_fields_text: ctx.messageText || '',
  save: false,
});
return [{ json: { ...ctx, edgeReqBody: reqBody } }];`;

const txtStep2MergeDraftCode =
`const ctx = $('TXT: Step2 Prepare').first().json;
const result = $input.first().json;
if (!result.success || !result.draft) {
  return [{ json: { ...ctx, draftError: true, draftErrMsg: result.error || 'ไม่สามารถสร้าง template ได้' } }];
}
const draft = result.draft;
const meta = (ctx.pending && ctx.pending.metadata) ? ctx.pending.metadata : {};
const updatedMeta = { ...meta, draft, step: 3 };
const patchBody = JSON.stringify({ step: 3, metadata: updatedMeta });
const colLines = draft.columns.map(c => '• ' + c.name + ' (' + c.type + ')').join('\\n');
const confirmFlex = {
  type: 'flex',
  altText: 'ยืนยันสร้าง Template: ' + draft.name,
  contents: {
    type: 'bubble',
    body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
      { type: 'text', text: '📋 Template ที่จะสร้าง', weight: 'bold', size: 'lg' },
      { type: 'text', text: '📌 ' + draft.name, weight: 'bold', size: 'md', color: '#4F46E5', margin: 'md' },
      { type: 'text', text: draft.columns.length + ' fields:', size: 'sm', color: '#555555', margin: 'sm' },
      { type: 'text', text: colLines, wrap: true, size: 'sm', color: '#333333', margin: 'xs' },
    ]},
    footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
      { type: 'button', action: { type: 'postback', label: '✅ ยืนยันสร้าง', data: 'action=template_confirm' }, style: 'primary', color: '#16A34A' },
      { type: 'button', action: { type: 'postback', label: '❌ ยกเลิก', data: 'action=template_cancel' }, style: 'secondary' },
    ]},
  },
};
return [{ json: { ...ctx, draft, patchBody, confirmFlex, draftError: false } }];`;

// ── Flex reply builder code nodes (avoids }} in n8n expression parser) ────────
const buildWelcomeCode =
`const ctx = $input.first().json;
const flex = {type:'flex',altText:'ยินดีต้อนรับสู่ P-Admin!',contents:{type:'bubble',hero:{type:'box',layout:'vertical',paddingAll:'20px',contents:[{type:'text',text:'สวัสดีครับ! 👋',weight:'bold',size:'xxl',align:'center'},{type:'text',text:'ผม พี่แอดมิน — AI แปลงเอกสารเป็นข้อมูล',wrap:true,align:'center',color:'#555555',size:'sm',margin:'sm'}]},body:{type:'box',layout:'vertical',spacing:'md',contents:[{type:'text',text:'ทำอะไรได้บ้าง?',weight:'bold',size:'md'},{type:'text',text:'• ส่งรูปเอกสาร → ได้ข้อมูลกลับทันที\\n• รองรับใบเสร็จ, invoice, ออเดอร์ ฯลฯ\\n• Export CSV และ sync Google Sheet\\n• พิมพ์ "สร้าง template" ให้ AI สร้างให้อัตโนมัติ',wrap:true,color:'#555555',size:'sm'},{type:'text',text:'กดปุ่มด้านล่างเพื่อถามได้เลยครับ 👇',wrap:true,color:'#888888',size:'xs',margin:'md'}]},footer:{type:'box',layout:'vertical',spacing:'sm',contents:[{type:'button',action:{type:'uri',label:'สมัคร / เข้าสู่ระบบ',uri:'` + WEBAPP_URL + `'},style:'primary',color:'#4F46E5'}]}}};
const qr = {items:[
  {type:'action',action:{type:'message',label:'ทำงานยังไง?',text:'ทำงานยังไง?'}},
  {type:'action',action:{type:'message',label:'ทำอะไรได้บ้าง?',text:'ทำอะไรได้บ้าง?'}},
  {type:'action',action:{type:'message',label:'รองรับภาษาอื่นมั้ย?',text:'รองรับภาษาอื่นมั้ย?'}},
  {type:'action',action:{type:'message',label:'ราคาเท่าไหร่?',text:'ราคาเท่าไหร่?'}},
  {type:'action',action:{type:'message',label:'ทดลองฟรีได้มั้ย?',text:'ทดลองฟรีได้มั้ย?'}},
  {type:'action',action:{type:'message',label:'เชื่อม Google Sheet ได้มั้ย?',text:'เชื่อม Google Sheet ได้มั้ย?'}},
  {type:'action',action:{type:'message',label:'เชื่อม Google Sheet ยังไง?',text:'เชื่อม Google Sheet ยังไง?'}},
  {type:'action',action:{type:'message',label:'📖 คู่มือการใช้งาน',text:'คู่มือการใช้งาน'}},
]};
return [{json:{...ctx, replyMsg:{to:ctx.userId, messages:[{...flex, quickReply:qr}]}}}];`;

const buildNotRegCode =
`const ctx = $input.first().json;
const flex = {type:'flex',altText:'ยังไม่ได้เชื่อมบัญชี',contents:{type:'bubble',body:{type:'box',layout:'vertical',spacing:'md',contents:[{type:'text',text:'ยังไม่ได้เชื่อมบัญชี',weight:'bold',size:'lg'},{type:'text',text:'สมัครใช้งานที่ webapp แล้วเชื่อม Line account ในหน้าทีมได้เลยครับ',wrap:true,color:'#555555',size:'sm'}]},footer:{type:'box',layout:'vertical',contents:[{type:'button',action:{type:'uri',label:'สมัคร / เข้าสู่ระบบ',uri:'` + WEBAPP_URL + `'},style:'primary',color:'#4F46E5'}]}}};
return [{json:{...ctx, replyMsg:{replyToken:ctx.replyToken, messages:[flex]}}}];`;

const buildNoTplsCode =
`const ctx = $input.first().json;
const flex = {type:'flex',altText:'ยังไม่มี Template',contents:{type:'bubble',body:{type:'box',layout:'vertical',spacing:'md',contents:[{type:'text',text:'ยังไม่มี Template',weight:'bold',size:'lg'},{type:'text',text:'สร้าง Template ก่อนได้เลยครับ\\nพิมพ์ "สร้าง template" แล้วผมจะช่วยสร้างให้ หรือสร้างได้ที่ webapp',wrap:true,color:'#555555',size:'sm'}]},footer:{type:'box',layout:'vertical',contents:[{type:'button',action:{type:'uri',label:'สร้างที่ webapp',uri:'` + WEBAPP_URL + `'},style:'primary',color:'#4F46E5'}]}}};
return [{json:{...ctx, replyMsg:{replyToken:ctx.replyToken, messages:[flex]}}}];`;

const buildTplCreatedCode =
`const ctx = $input.first().json;
const flex = {type:'flex',altText:'สร้าง Template สำเร็จ!',contents:{type:'bubble',body:{type:'box',layout:'vertical',spacing:'sm',contents:[{type:'text',text:'สร้าง Template สำเร็จ!',weight:'bold',size:'lg',color:'#16A34A'},{type:'text',text:'📌 '+ctx.tplName,weight:'bold',size:'md',margin:'sm'},{type:'text',text:'มี '+ctx.tplColumns.length+' fields — พร้อมใช้งานแล้วครับ\\nส่งรูปเอกสารมาได้เลย!',wrap:true,size:'sm',color:'#555555',margin:'sm'}]},footer:{type:'box',layout:'vertical',contents:[{type:'button',action:{type:'uri',label:'แก้ไข Template',uri:'` + WEBAPP_URL + `'},style:'secondary'}]}}};
return [{json:{...ctx, replyMsg:{to:ctx.userId, messages:[flex]}}}];`;

// ── Account Link flex builders (dynamic linkToken from LINE API) ──────────────

const imgBuildLinkFlexCode =
`const ctx = $('IMG: Merge Org').first().json;
const linkToken = $input.first().json.linkToken;
const linkUrl = '` + WEBAPP_URL + `/link-line?linkToken=' + encodeURIComponent(linkToken);
const flex = {type:'flex',altText:'เชื่อม LINE กับ P-Admin',contents:{type:'bubble',body:{type:'box',layout:'vertical',spacing:'md',contents:[{type:'text',text:'🔗 เชื่อม LINE Account',weight:'bold',size:'lg'},{type:'text',text:'สมัครบัญชี P-Admin ก่อน แล้วกดปุ่มด้านล่างเพื่อเชื่อม LINE ได้เลยครับ',wrap:true,color:'#555555',size:'sm'}]},footer:{type:'box',layout:'vertical',contents:[{type:'button',action:{type:'uri',label:'สมัคร / เชื่อม LINE',uri:linkUrl},style:'primary',color:'#4F46E5'}]}}};
return [{json:{...ctx, replyMsg:{replyToken:ctx.replyToken, messages:[flex]}}}];`;

const txtBuildLinkFlexCode =
`const ctx = $('TXT: Classify State').first().json;
const linkToken = $input.first().json.linkToken;
const linkUrl = '` + WEBAPP_URL + `/link-line?linkToken=' + encodeURIComponent(linkToken);
const flex = {type:'flex',altText:'เชื่อม LINE กับ P-Admin',contents:{type:'bubble',body:{type:'box',layout:'vertical',spacing:'md',contents:[{type:'text',text:'🔗 เชื่อม LINE Account',weight:'bold',size:'lg'},{type:'text',text:'สมัครบัญชี P-Admin ก่อน แล้วกดปุ่มด้านล่างเพื่อเชื่อม LINE ได้เลยครับ',wrap:true,color:'#555555',size:'sm'}]},footer:{type:'box',layout:'vertical',contents:[{type:'button',action:{type:'uri',label:'สมัคร / เชื่อม LINE',uri:linkUrl},style:'primary',color:'#4F46E5'}]}}};
return [{json:{...ctx, replyMsg:{replyToken:ctx.replyToken, messages:[flex]}}}];`;

const alBuildOkMsgCode =
`const event = $('AL: Link OK?').first().json;
const result = $input.first().json;
const orgName = result.org_name || '';
const msgText = result.success
  ? '✅ เชื่อม LINE สำเร็จแล้วครับ!\\n\\n' + (orgName ? 'ทีม: ' + orgName + '\\n\\n' : '') + 'ตอนนี้ส่งรูปเอกสารมาได้เลยครับ!\\nพิมพ์ "สร้าง template" ถ้ายังไม่มี template'
  : '❌ เชื่อม LINE ไม่สำเร็จครับ\\nลิงก์อาจหมดอายุแล้ว ลองกดปุ่มในบอทใหม่ได้เลย';
return [{ json: { ...event, replyMsg: { to: event.userId, messages: [{ type: 'text', text: msgText }] } } }];`;

// ─── Node definitions ─────────────────────────────────────────────────────────

const nodes = [

  // ── Entry ────────────────────────────────────────────────────────────────────
  { parameters: { httpMethod: 'POST', path: 'line-webhook', responseMode: 'responseNode', options: {} }, id: '1', name: 'Line Webhook', type: 'n8n-nodes-base.webhook', typeVersion: 2, position: [200, 500], webhookId: 'padmin-line-chatbot' },
  { parameters: { respondWith: 'text', responseBody: 'OK', options: { responseCode: 200 } }, id: '2', name: 'Respond 200 OK', type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1, position: [420, 300] },
  code('3', 'Extract Event', extractEventCode, [420, 560]),
  sw('4', 'Route by Event Type', '={{ $json.type }}', ['message', 'postback', 'follow', 'accountLink'], [640, 560], 'none'),
  sw('5', 'Route by Message Type', '={{ $json.messageType }}', ['image', 'file', 'text'], [860, 480], 'none'),

  // ── Follow ───────────────────────────────────────────────────────────────────
  code('follow-build', 'Build: Welcome', buildWelcomeCode, [860, 200]),
  post('follow-welcome', 'Push: Welcome', LINE_PUSH, lineH(), '={{ JSON.stringify($json.replyMsg) }}', [1080, 200]),

  // ── POSTBACK ─────────────────────────────────────────────────────────────────
  code('pb-parse', 'Parse Postback', parsePostbackCode, [860, 640]),
  sw('pb-route', 'Switch: Postback Action', '={{ $json.pbAction }}',
    ['select_template', 'template_confirm', 'template_cancel', 'skip_image'],
    [1080, 640], 'none'),

  // ── POSTBACK: select_template ─────────────────────────────────────────────
  get('pb-get-pending', 'PB: Get Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&job_type=eq.extraction&limit=1',
    [1300, 480]),
  code('pb-merge', 'PB: Merge Pending', pbMergePendingCode, [1520, 480]),
  ifNode('pb-found', 'PB: Pending Found?', '={{ $json.pendingFound }}', 'equal', true, [1740, 480]),

  post('pb-no-pending', 'PB: No Pending',
    LINE_PUSH, lineH(),
    '={{ JSON.stringify({ to: $json.userId, messages: [{ type: \'text\', text: \'ไม่พบเอกสารที่รอประมวลผลครับ\\nส่งรูปภาพหรือ PDF ใหม่มาได้เลย\' }] }) }}',
    [1960, 580]),

  post('pb-reply-processing', 'PB: Reply Processing',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify({ replyToken: $json.replyToken, messages: [{ type: \'text\', text: \'⏳ กำลังประมวลผล...\\nโปรดรอสักครู่นะครับ\' }] }) }}',
    [1960, 400]),

  postEdge('pb-process', 'PB: Process Document',
    EDGE + '/process-document-line',
    '={{ JSON.stringify({ org_id: $json.pending.org_id, template_id: $json.templateId || null, line_user_id: $json.userId, line_message_id: $json.pending.line_message_id }) }}',
    [2180, 400]),

  code('pb-format', 'PB: Format Result', pbFormatResultCode, [2400, 400]),

  post('pb-push-result', 'PB: Push Result',
    LINE_PUSH, lineH(),
    '={{ JSON.stringify({ to: $json.userId, messages: [$json.isError ? { type: \'text\', text: $json.errorText } : $json.flexMsg] }) }}',
    [2620, 400]),

  del('pb-delete-pending', 'PB: Delete Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&job_type=eq.extraction',
    [2840, 400]),

  // ── POSTBACK: template_confirm ────────────────────────────────────────────
  get('pb-tpl-get', 'PB: Get Tpl Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&job_type=eq.template_creation&limit=1',
    [1300, 680]),
  code('pb-tpl-merge', 'PB: Merge Tpl Pending', pbTplMergeCode, [1520, 680]),
  ifNode('pb-tpl-found', 'PB: Tpl Found?', '={{ $json.pendingFound }}', 'equal', true, [1740, 680]),

  post('pb-tpl-notfound', 'PB: Tpl Not Found',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify({ replyToken: $json.replyToken, messages: [{ type: \'text\', text: \'หมดเวลาแล้วครับ ลองใหม่ได้โดยพิมพ์ "สร้าง template" ครับ\' }] }) }}',
    [1960, 780]),

  post('pb-tpl-insert', 'PB: Insert Template',
    REST + '/extraction_templates',
    sbH([{ name: 'Content-Type', value: 'application/json' }, { name: 'Prefer', value: 'return=minimal' }]),
    '={{ JSON.stringify({ user_id: $json.tplOwnerId, name: $json.tplName, description: \'สร้างผ่าน Line Bot\', columns: $json.tplColumns, custom_prompt: $json.tplPrompt, webhook_url: null, google_sheet_url: null, header_row_index: 1 }) }}',
    [1960, 620]),

  del('pb-tpl-delete', 'PB: Delete Tpl Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&job_type=eq.template_creation',
    [2180, 620]),

  code('pb-build-tpl-success', 'PB: Build Tpl Created', buildTplCreatedCode, [2180, 620]),
  post('pb-tpl-success', 'PB: Push Tpl Created', LINE_PUSH, lineH(), '={{ JSON.stringify($json.replyMsg) }}', [2400, 620]),

  // ── POSTBACK: template_cancel ─────────────────────────────────────────────
  del('pb-cancel-delete', 'PB: Cancel Delete',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&job_type=eq.template_creation',
    [1300, 820]),

  post('pb-cancel-reply', 'PB: Cancel Reply',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify({ replyToken: $json.replyToken, messages: [{ type: \'text\', text: \'ยกเลิกแล้วครับ 👍\' }] }) }}',
    [1520, 820]),

  // ── POSTBACK: skip_image ──────────────────────────────────────────────────
  get('pb-skip-get', 'PB: Skip Get Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&job_type=eq.template_creation&limit=1',
    [1300, 960]),
  code('pb-skip-merge', 'PB: Skip Merge', pbSkipMergeCode, [1520, 960]),
  patchSb('pb-skip-update', 'PB: Skip Update Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&job_type=eq.template_creation',
    '={{ $json.patchBody }}',
    [1740, 960]),
  post('pb-skip-reply', 'PB: Reply Ask Fields',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify({ replyToken: $json.replyToken, messages: [{ type: \'text\', text: \'โอเคครับ 👍\\nอยากดึงข้อมูลอะไรบ้าง?\\n\\nตัวอย่าง: ชื่อลูกค้า, วันที่, ยอดรวม, เลขที่ใบแจ้งหนี้\\n\\nพิมพ์มาได้เลยครับ\' }] }) }}',
    [1960, 960]),

  // ── IMAGE / FILE flow ─────────────────────────────────────────────────────
  rpc('img-resolve-org', 'IMG: Resolve Org',
    REST + '/rpc/get_org_by_line_user',
    '={{ JSON.stringify({ p_line_user_id: $json.userId }) }}',
    [1080, 1120]),
  code('img-merge-org', 'IMG: Merge Org', imgMergeOrgCode, [1300, 1120]),
  ifNode('img-org-found', 'IMG: Org Found?', '={{ $json.orgFound }}', 'equal', true, [1520, 1120]),

  // IMG: not registered → get LINE linkToken → reply with account-link flex
  post('img-get-link-token', 'IMG: Get Link Token',
    '={{ "https://api.line.me/v2/bot/user/" + $json.userId + "/linkToken" }}',
    lineH(), '{}', [1520, 1240]),
  code('img-build-link-flex', 'IMG: Build Link Flex', imgBuildLinkFlexCode, [1740, 1240]),
  post('img-link-reply', 'IMG: Link Reply', LINE_REPLY, lineH(), '={{ JSON.stringify($json.replyMsg) }}', [1960, 1240]),

  get('img-get-pending', 'IMG: Get Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&limit=1',
    [1740, 1040]),
  code('img-classify', 'IMG: Classify State', imgClassifyCode, [1960, 1040]),
  sw('img-state-switch', 'IMG: Switch State', '={{ $json.state }}',
    ['template_step1', 'extraction_lock', 'proceed'],
    [2180, 1040], 'none'),

  // IMG: template_step1
  code('img-tpl1-prepare', 'IMG: Tpl1 Prepare', imgTpl1PrepareCode, [2400, 900]),
  patchSb('img-tpl1-update', 'IMG: Tpl1 Update Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&job_type=eq.template_creation',
    '={{ $json.patchBody }}',
    [2620, 900]),
  post('img-tpl1-reply', 'IMG: Tpl1 Reply Ask Fields',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify({ replyToken: $json.replyToken, messages: [{ type: \'text\', text: \'ได้รับรูปแล้วครับ 📸\\nอยากดึงข้อมูลอะไรบ้าง?\\n\\nตัวอย่าง: ชื่อลูกค้า, วันที่, ยอดรวม\\n\\nพิมพ์มาได้เลยครับ\' }] }) }}',
    [2840, 900]),

  // IMG: extraction_lock
  get('img-lock-get-tpls', 'IMG: Lock Get Templates',
    REST + '/extraction_templates?user_id=eq.{{ $json.org.owner_id }}&select=id,name&order=created_at.asc&limit=12',
    [2400, 1040]),
  code('img-lock-build', 'IMG: Lock Build QR', imgLockBuildCode, [2620, 1040]),
  post('img-lock-reply', 'IMG: Lock Reply',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify($json.lineMessage) }}',
    [2840, 1040]),

  // IMG: proceed
  del('img-proc-del-old', 'IMG: Proceed Del Old',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}',
    [2400, 1160]),
  get('img-proc-get-tpls', 'IMG: Proceed Get Templates',
    REST + '/extraction_templates?user_id=eq.{{ $("IMG: Classify State").first().json.org.owner_id }}&select=id,name&order=created_at.asc&limit=12',
    [2620, 1160]),
  code('img-proc-classify-tpls', 'IMG: Proceed Classify Templates', imgProcClassifyTplsCode, [2840, 1160]),
  ifNode('img-proc-has-tpls', 'IMG: Has Templates?', '={{ $json.hasTemplates }}', 'equal', true, [3060, 1160]),

  code('img-build-no-tpls', 'IMG: Build No Templates', buildNoTplsCode, [3060, 1260]),
  post('img-proc-no-tpls', 'IMG: No Templates', LINE_REPLY, lineH(), '={{ JSON.stringify($json.replyMsg) }}', [3280, 1260]),

  post('img-proc-store', 'IMG: Store Extraction Pending',
    REST + '/line_pending_jobs',
    sbH([{ name: 'Content-Type', value: 'application/json' }, { name: 'Prefer', value: 'resolution=merge-duplicates' }]),
    '={{ JSON.stringify({ line_user_id: $json.userId, org_id: $json.org.org_id, line_message_id: $json.messageId, job_type: "extraction", step: 0, metadata: {} }) }}',
    [3280, 1060]),

  post('img-proc-reply', 'IMG: Reply Template Selection',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify($json.lineMessage) }}',
    [3500, 1060]),

  // ── TEXT flow ─────────────────────────────────────────────────────────────
  rpc('txt-resolve-org', 'TXT: Resolve Org',
    REST + '/rpc/get_org_by_line_user',
    '={{ JSON.stringify({ p_line_user_id: $json.userId }) }}',
    [1080, 1560]),
  get('txt-get-pending', 'TXT: Get Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $("Extract Event").first().json.userId }}&limit=1',
    [1300, 1560]),
  code('txt-classify', 'TXT: Classify State', txtClassifyCode, [1520, 1560]),
  sw('txt-switch', 'TXT: Switch State', '={{ $json.state }}',
    ['template_step2', 'template_command', 'credits_query'],
    [1740, 1560], 3),
  ifStr('txt-reg-check', 'TXT: Reg or Fallback?', '={{ $json.state }}', 'equal', 'not_registered', [1960, 1700]),

  // TXT: template_step2
  code('txt-step2-prepare', 'TXT: Step2 Prepare', txtStep2PrepareCode, [1960, 1380]),
  postEdge('txt-step2-gen', 'TXT: Step2 Gen Draft',
    EDGE + '/create-template-from-image',
    '={{ $json.edgeReqBody }}',
    [2180, 1380]),
  code('txt-step2-merge', 'TXT: Step2 Merge Draft', txtStep2MergeDraftCode, [2400, 1380]),
  patchSb('txt-step2-update', 'TXT: Step2 Update Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}&job_type=eq.template_creation',
    '={{ $json.patchBody }}',
    [2620, 1380]),
  post('txt-step2-reply', 'TXT: Step2 Reply Confirm',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify({ replyToken: $json.replyToken, messages: [$json.draftError ? { type: \'text\', text: \'ขออภัยครับ \' + $json.draftErrMsg + \' ลองใหม่ได้เลย\' } : $json.confirmFlex] }) }}',
    [2840, 1380]),

  // TXT: template_command
  ifNode('txt-cmd-check', 'TXT: Cmd Org Check', '={{ $json.orgFound }}', 'equal', true, [1960, 1560]),
  code('txt-build-not-reg', 'TXT: Build Not Reg', buildNotRegCode, [1960, 1660]),
  post('txt-cmd-not-reg', 'TXT: Cmd Not Reg', LINE_REPLY, lineH(), '={{ JSON.stringify($json.replyMsg) }}', [2180, 1660]),
  del('txt-cmd-del-pending', 'TXT: Cmd Del Pending',
    REST + '/line_pending_jobs?line_user_id=eq.{{ $json.userId }}',
    [2180, 1460]),
  post('txt-cmd-store', 'TXT: Cmd Store Pending',
    REST + '/line_pending_jobs',
    sbH([{ name: 'Content-Type', value: 'application/json' }, { name: 'Prefer', value: 'resolution=merge-duplicates' }]),
    '={{ JSON.stringify({ line_user_id: $json.userId, org_id: $json.org.org_id, line_message_id: "", job_type: "template_creation", step: 1, metadata: { owner_id: $json.org.owner_id } }) }}',
    [2400, 1460]),
  post('txt-cmd-reply', 'TXT: Cmd Reply',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify({ replyToken: $json.replyToken, messages: [{ type: \'text\', text: \'สร้าง Template ใหม่ได้เลยครับ 🎉\\n\\nมีรูปตัวอย่างเอกสารมั้ยครับ?\\nถ้ามี ส่งรูปมาได้เลย\\nถ้าไม่มี กด "ข้ามได้" แล้วบอกว่าอยากดึงข้อมูลอะไรบ้างครับ\', quickReply: { items: [{ type: \'action\', action: { type: \'postback\', label: \'ข้ามได้ ไม่มีรูป\', data: \'action=skip_image\', displayText: \'ข้ามได้ ไม่มีรูปตัวอย่าง\' } }] } }] }) }}',
    [2620, 1460]),

  // TXT: credits_query
  post('txt-credits-reply', 'TXT: Credits Reply',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify({ replyToken: $json.replyToken, messages: [{ type: \'text\', text: $json.orgFound ? (\'💳 เครดิตคงเหลือ\\n\\n\' + $json.org.org_name + \'\\n\' + $json.credits + \' เครดิต\') : \'กรุณาสมัครและเชื่อม Line account ก่อนนะครับ\' }] }) }}',
    [1960, 1740]),

  // TXT: not_registered → get LINE linkToken → reply with account-link flex
  post('txt-get-link-token', 'TXT: Get Link Token',
    '={{ "https://api.line.me/v2/bot/user/" + $json.userId + "/linkToken" }}',
    lineH(), '{}', [1960, 1840]),
  code('txt-build-link-flex', 'TXT: Build Link Flex', txtBuildLinkFlexCode, [2180, 1840]),
  post('txt-link-flex-reply', 'TXT: Link Flex Reply',
    LINE_REPLY, lineH(), '={{ JSON.stringify($json.replyMsg) }}', [2400, 1840]),

  // ── accountLink event ─────────────────────────────────────────────────────
  ifStr('al-link-ok', 'AL: Link OK?', '={{ $json.linkResult }}', 'equal', 'ok', [860, 800]),
  rpc('al-use-nonce', 'AL: Use Nonce',
    REST + '/rpc/use_link_nonce',
    '={{ JSON.stringify({ p_nonce: $json.linkNonce, p_line_user_id: $json.userId }) }}',
    [1080, 740]),
  code('al-build-ok-msg', 'AL: Build OK Msg', alBuildOkMsgCode, [1300, 740]),
  post('al-push-ok', 'AL: Push OK',
    LINE_PUSH, lineH(), '={{ JSON.stringify($json.replyMsg) }}', [1520, 740]),
  post('al-push-fail', 'AL: Push Failed',
    LINE_PUSH, lineH(),
    '={{ JSON.stringify({ to: $json.userId, messages: [{ type: \'text\', text: \'เชื่อม LINE ไม่สำเร็จครับ ลองกดปุ่มในบอทใหม่ได้เลย\' }] }) }}',
    [1080, 860]),

  // ── AI Agent (fallback — text & other message types) ──────────────────────
  {
    parameters: {
      promptType: 'define',
      text: '={{ $json.messageText || "(ผู้ใช้ส่ง " + ($json.messageType || "ข้อความ") + ")" }}',
      options: {
        systemMessage:
          'คุณคือ "พี่แอดมิน" — AI assistant ของ P-Admin บริการแปลงเอกสารเป็น structured data\n\n' +
          'บริการ P-Admin:\n' +
          '- ส่งรูปเอกสาร หรือ PDF ใน Line → เลือก Template → ได้ข้อมูลกลับทันที\n' +
          '- รองรับทุกประเภท: ใบเสร็จ, invoice, ออเดอร์, VIN, stock ฯลฯ\n' +
          '- Export CSV หรือ sync Google Sheet อัตโนมัติ\n' +
          '- สร้าง Template ผ่าน chat: พิมพ์ "สร้าง template"\n' +
          '- ดูเครดิตคงเหลือ: พิมพ์ "เครดิต"\n' +
          '- สมัคร/ดูราคา: ' + WEBAPP_URL + '\n\n' +
          'กฎการตอบ:\n' +
          '- ตอบภาษาไทย กระชับ เป็นมิตร ไม่เกิน 3-4 ประโยค\n' +
          '- ถ้าไม่รู้บอกตรงๆ อย่า guess\n' +
          '- ถ้าถามนอกเรื่อง service ให้พากลับมาอย่างสุภาพ\n' +
          '- ถ้าผู้ใช้ส่ง sticker หรือไฟล์ที่ไม่ใช่เอกสาร ให้แนะนำให้ส่งรูปหรือ PDF มาแทน',
      },
    },
    id: 'ai-agent', name: 'AI Agent', type: '@n8n/n8n-nodes-langchain.agent',
    typeVersion: 1.6, position: [1960, 1940],
  },
  {
    parameters: { modelName: 'models/gemini-2.0-flash', options: { temperature: 0.7, maxOutputTokens: 512 } },
    id: 'ai-gemini', name: 'Google Gemini Chat Model', type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
    typeVersion: 1, position: [1860, 2100],
  },
  {
    parameters: { sessionIdType: 'customKey', sessionKey: '={{ $("Extract Event").first().json.userId }}', contextWindowLength: 6 },
    id: 'ai-memory', name: 'Window Buffer Memory', type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
    typeVersion: 1.2, position: [2060, 2100],
  },
  post('ai-reply', 'Reply: AI Response',
    LINE_REPLY, lineH(),
    '={{ JSON.stringify({ replyToken: $("Extract Event").first().json.replyToken, messages: [{ type: \'text\', text: $json.output }] }) }}',
    [2200, 1940]),
];

// ─── Connections ──────────────────────────────────────────────────────────────
const connections = {
  'Line Webhook':               { main: [[{ node: 'Respond 200 OK', type: 'main', index: 0 }, { node: 'Extract Event', type: 'main', index: 0 }]] },
  'Extract Event':              { main: [[{ node: 'Route by Event Type', type: 'main', index: 0 }]] },
  'Route by Event Type':        { main: [
    [{ node: 'Route by Message Type', type: 'main', index: 0 }],
    [{ node: 'Parse Postback', type: 'main', index: 0 }],
    [{ node: 'Build: Welcome', type: 'main', index: 0 }],
    [{ node: 'AL: Link OK?', type: 'main', index: 0 }],
  ]},
  'Build: Welcome':             { main: [[{ node: 'Push: Welcome', type: 'main', index: 0 }]] },
  'Route by Message Type':      { main: [
    [{ node: 'IMG: Resolve Org', type: 'main', index: 0 }],  // image
    [{ node: 'IMG: Resolve Org', type: 'main', index: 0 }],  // file → same path
    [{ node: 'TXT: Resolve Org', type: 'main', index: 0 }],  // text
  ]},

  // Postback routing
  'Parse Postback':             { main: [[{ node: 'Switch: Postback Action', type: 'main', index: 0 }]] },
  'Switch: Postback Action':    { main: [
    [{ node: 'PB: Get Pending',     type: 'main', index: 0 }],
    [{ node: 'PB: Get Tpl Pending', type: 'main', index: 0 }],
    [{ node: 'PB: Cancel Delete',   type: 'main', index: 0 }],
    [{ node: 'PB: Skip Get Pending',type: 'main', index: 0 }],
  ]},

  // POSTBACK: select_template
  'PB: Get Pending':            { main: [[{ node: 'PB: Merge Pending', type: 'main', index: 0 }]] },
  'PB: Merge Pending':          { main: [[{ node: 'PB: Pending Found?', type: 'main', index: 0 }]] },
  'PB: Pending Found?':         { main: [
    [{ node: 'PB: Reply Processing', type: 'main', index: 0 }],
    [{ node: 'PB: No Pending',       type: 'main', index: 0 }],
  ]},
  'PB: Reply Processing':       { main: [[{ node: 'PB: Process Document', type: 'main', index: 0 }]] },
  'PB: Process Document':       { main: [[{ node: 'PB: Format Result',   type: 'main', index: 0 }]] },
  'PB: Format Result':          { main: [[{ node: 'PB: Push Result', type: 'main', index: 0 }, { node: 'PB: Delete Pending', type: 'main', index: 0 }]] },

  // POSTBACK: template_confirm
  'PB: Get Tpl Pending':        { main: [[{ node: 'PB: Merge Tpl Pending', type: 'main', index: 0 }]] },
  'PB: Merge Tpl Pending':      { main: [[{ node: 'PB: Tpl Found?',        type: 'main', index: 0 }]] },
  'PB: Tpl Found?':             { main: [
    [{ node: 'PB: Insert Template', type: 'main', index: 0 }],
    [{ node: 'PB: Tpl Not Found',   type: 'main', index: 0 }],
  ]},
  'PB: Insert Template':        { main: [[{ node: 'PB: Delete Tpl Pending', type: 'main', index: 0 }]] },
  'PB: Delete Tpl Pending':     { main: [[{ node: 'PB: Build Tpl Created',  type: 'main', index: 0 }]] },
  'PB: Build Tpl Created':      { main: [[{ node: 'PB: Push Tpl Created',   type: 'main', index: 0 }]] },

  // POSTBACK: template_cancel
  'PB: Cancel Delete':          { main: [[{ node: 'PB: Cancel Reply', type: 'main', index: 0 }]] },

  // POSTBACK: skip_image
  'PB: Skip Get Pending':       { main: [[{ node: 'PB: Skip Merge',          type: 'main', index: 0 }]] },
  'PB: Skip Merge':             { main: [[{ node: 'PB: Skip Update Pending', type: 'main', index: 0 }]] },
  'PB: Skip Update Pending':    { main: [[{ node: 'PB: Reply Ask Fields',    type: 'main', index: 0 }]] },

  // IMAGE flow
  'IMG: Resolve Org':           { main: [[{ node: 'IMG: Merge Org',    type: 'main', index: 0 }]] },
  'IMG: Merge Org':             { main: [[{ node: 'IMG: Org Found?',   type: 'main', index: 0 }]] },
  'IMG: Org Found?':            { main: [
    [{ node: 'IMG: Get Pending',          type: 'main', index: 0 }],
    [{ node: 'IMG: Get Link Token',       type: 'main', index: 0 }],
  ]},
  'IMG: Get Link Token':        { main: [[{ node: 'IMG: Build Link Flex', type: 'main', index: 0 }]] },
  'IMG: Build Link Flex':       { main: [[{ node: 'IMG: Link Reply',       type: 'main', index: 0 }]] },
  'IMG: Get Pending':           { main: [[{ node: 'IMG: Classify State', type: 'main', index: 0 }]] },
  'IMG: Classify State':        { main: [[{ node: 'IMG: Switch State',   type: 'main', index: 0 }]] },
  'IMG: Switch State':          { main: [
    [{ node: 'IMG: Tpl1 Prepare',              type: 'main', index: 0 }],
    [{ node: 'IMG: Lock Get Templates',        type: 'main', index: 0 }],
    [{ node: 'IMG: Proceed Del Old',           type: 'main', index: 0 }],
  ]},

  // IMG: template_step1
  'IMG: Tpl1 Prepare':          { main: [[{ node: 'IMG: Tpl1 Update Pending', type: 'main', index: 0 }]] },
  'IMG: Tpl1 Update Pending':   { main: [[{ node: 'IMG: Tpl1 Reply Ask Fields', type: 'main', index: 0 }]] },

  // IMG: extraction_lock
  'IMG: Lock Get Templates':    { main: [[{ node: 'IMG: Lock Build QR', type: 'main', index: 0 }]] },
  'IMG: Lock Build QR':         { main: [[{ node: 'IMG: Lock Reply',    type: 'main', index: 0 }]] },

  // IMG: proceed
  'IMG: Proceed Del Old':           { main: [[{ node: 'IMG: Proceed Get Templates',        type: 'main', index: 0 }]] },
  'IMG: Proceed Get Templates':     { main: [[{ node: 'IMG: Proceed Classify Templates',   type: 'main', index: 0 }]] },
  'IMG: Proceed Classify Templates':{ main: [[{ node: 'IMG: Has Templates?',              type: 'main', index: 0 }]] },
  'IMG: Has Templates?':            { main: [
    [{ node: 'IMG: Store Extraction Pending', type: 'main', index: 0 }],
    [{ node: 'IMG: Build No Templates',       type: 'main', index: 0 }],
  ]},
  'IMG: Build No Templates':        { main: [[{ node: 'IMG: No Templates', type: 'main', index: 0 }]] },
  'IMG: Store Extraction Pending':  { main: [[{ node: 'IMG: Reply Template Selection', type: 'main', index: 0 }]] },

  // TEXT flow
  'TXT: Resolve Org':           { main: [[{ node: 'TXT: Get Pending',     type: 'main', index: 0 }]] },
  'TXT: Get Pending':           { main: [[{ node: 'TXT: Classify State',  type: 'main', index: 0 }]] },
  'TXT: Classify State':        { main: [[{ node: 'TXT: Switch State',    type: 'main', index: 0 }]] },
  'TXT: Switch State':          { main: [
    [{ node: 'TXT: Step2 Prepare',    type: 'main', index: 0 }],  // template_step2
    [{ node: 'TXT: Cmd Org Check',    type: 'main', index: 0 }],  // template_command
    [{ node: 'TXT: Credits Reply',    type: 'main', index: 0 }],  // credits_query
    [{ node: 'TXT: Reg or Fallback?', type: 'main', index: 0 }],  // fallback (catches not_registered + true fallback)
  ]},
  'TXT: Reg or Fallback?':      { main: [
    [{ node: 'TXT: Get Link Token', type: 'main', index: 0 }],  // true = not_registered
    [{ node: 'AI Agent',            type: 'main', index: 0 }],  // false = fallback
  ]},

  // TXT: template_step2
  'TXT: Step2 Prepare':         { main: [[{ node: 'TXT: Step2 Gen Draft',    type: 'main', index: 0 }]] },
  'TXT: Step2 Gen Draft':       { main: [[{ node: 'TXT: Step2 Merge Draft',  type: 'main', index: 0 }]] },
  'TXT: Step2 Merge Draft':     { main: [[{ node: 'TXT: Step2 Update Pending', type: 'main', index: 0 }]] },
  'TXT: Step2 Update Pending':  { main: [[{ node: 'TXT: Step2 Reply Confirm', type: 'main', index: 0 }]] },

  // TXT: template_command
  'TXT: Cmd Org Check':         { main: [
    [{ node: 'TXT: Cmd Del Pending', type: 'main', index: 0 }],
    [{ node: 'TXT: Build Not Reg',   type: 'main', index: 0 }],
  ]},
  'TXT: Build Not Reg':         { main: [[{ node: 'TXT: Cmd Not Reg', type: 'main', index: 0 }]] },
  'TXT: Cmd Del Pending':       { main: [[{ node: 'TXT: Cmd Store Pending', type: 'main', index: 0 }]] },
  'TXT: Cmd Store Pending':     { main: [[{ node: 'TXT: Cmd Reply',         type: 'main', index: 0 }]] },

  // TXT: not_registered
  'TXT: Get Link Token':        { main: [[{ node: 'TXT: Build Link Flex',  type: 'main', index: 0 }]] },
  'TXT: Build Link Flex':       { main: [[{ node: 'TXT: Link Flex Reply',  type: 'main', index: 0 }]] },

  // accountLink event
  'AL: Link OK?':               { main: [
    [{ node: 'AL: Use Nonce',   type: 'main', index: 0 }],   // true
    [{ node: 'AL: Push Failed', type: 'main', index: 0 }],   // false
  ]},
  'AL: Use Nonce':              { main: [[{ node: 'AL: Build OK Msg', type: 'main', index: 0 }]] },
  'AL: Build OK Msg':           { main: [[{ node: 'AL: Push OK',      type: 'main', index: 0 }]] },

  // AI Agent
  'Google Gemini Chat Model':   { ai_languageModel: [[{ node: 'AI Agent', type: 'ai_languageModel', index: 0 }]] },
  'Window Buffer Memory':       { ai_memory:        [[{ node: 'AI Agent', type: 'ai_memory',        index: 0 }]] },
  'AI Agent':                   { main: [[{ node: 'Reply: AI Response', type: 'main', index: 0 }]] },
};

// ─── Write ────────────────────────────────────────────────────────────────────
const workflow = {
  name: 'P-Admin Line Chatbot v2',
  nodes,
  connections,
  active: false,
  settings: { executionOrder: 'v1' },
  id: 'padmin-line-chatbot-002',
  tags: [],
};

const outPath = 'C:/Users/HP/.gemini/antigravity/scratch/DocuReader/n8n/p-admin-line-chatbot.json';
fs.writeFileSync(outPath, JSON.stringify(workflow, null, 2));
const size = fs.statSync(outPath).size;
console.log('OK — nodes:', nodes.length, '— bytes:', size);
