function encodeBase64Url(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)

  const headerB64 = encodeBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payloadB64 = encodeBase64Url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }))
  const signingInput = `${headerB64}.${payloadB64}`

  const pemKey = sa.private_key.replace(/\\n/g, '\n')
  const pemBody = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )
  const sigBytes = new Uint8Array(signatureBytes)
  let sigBinary = ''
  for (let i = 0; i < sigBytes.length; i++) sigBinary += String.fromCharCode(sigBytes[i])
  const signatureB64 = encodeBase64Url(sigBinary)
  const jwt = `${signingInput}.${signatureB64}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const tokenData = await res.json()
  if (!tokenData.access_token) throw new Error('Failed to get Google access token: ' + JSON.stringify(tokenData))
  return tokenData.access_token
}

export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

function toColumnLetter(index: number): string {
  if (index < 26) return String.fromCharCode(65 + index)
  return String.fromCharCode(64 + Math.floor(index / 26)) + String.fromCharCode(65 + (index % 26))
}

async function getLastSequenceValue(accessToken: string, spreadsheetId: string, colIndex: number): Promise<string | null> {
  const col = toColumnLetter(colIndex)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!${col}:${col}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const values: string[][] = data.values || []
  // skip header row (index 0), find last non-empty value
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i]?.[0]?.trim()) return values[i][0].trim()
  }
  return null
}

function generateSequence(format: string, num: number): string {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = String(now.getFullYear())
  const yy = yyyy.slice(2)

  // find N+ pattern to determine digit padding
  const nMatch = format.match(/\{(N+)\}/)
  const digits = nMatch ? nMatch[1].length : 3

  return format
    .replace(/\{MM\}/g, mm)
    .replace(/\{YYYY\}/g, yyyy)
    .replace(/\{YY\}/g, yy)
    .replace(/\{N+\}/g, String(num).padStart(digits, '0'))
}

function parseLastNumber(value: string): number {
  const matches = value.match(/\d+/g)
  if (!matches || matches.length === 0) return 0
  return parseInt(matches[matches.length - 1])
}

export async function appendToGoogleSheet(
  serviceAccountJson: string,
  sheetUrl: string,
  rows: Record<string, unknown>[],
  columns: { name: string; type?: string; format?: string }[],
): Promise<void> {
  const spreadsheetId = extractSpreadsheetId(sheetUrl)
  if (!spreadsheetId) throw new Error('Invalid Google Sheet URL')

  const accessToken = await getGoogleAccessToken(serviceAccountJson)

  // resolve starting sequence numbers for sequence columns
  const sequenceStarts: Record<number, number> = {}
  for (let ci = 0; ci < columns.length; ci++) {
    if (columns[ci].type === 'sequence') {
      const lastVal = await getLastSequenceValue(accessToken, spreadsheetId, ci)
      sequenceStarts[ci] = lastVal ? parseLastNumber(lastVal) + 1 : 1
    }
  }

  const values = rows.map((row, rowIdx) =>
    columns.map((col, ci) => {
      if (col.type === 'sequence') {
        const fmt = col.format || '{MM}/{NNN}'
        return generateSequence(fmt, sequenceStarts[ci] + rowIdx)
      }
      const val = row[col.name]
      return val === null || val === undefined ? '' : val
    })
  )

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Sheets API error: ${err}`)
  }
}
