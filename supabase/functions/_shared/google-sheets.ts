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
  const signatureB64 = encodeBase64Url(btoa(String.fromCharCode(...new Uint8Array(signatureBytes))))
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

export async function appendToGoogleSheet(
  serviceAccountJson: string,
  sheetUrl: string,
  rows: Record<string, unknown>[],
  columns: { name: string }[],
): Promise<void> {
  const spreadsheetId = extractSpreadsheetId(sheetUrl)
  if (!spreadsheetId) throw new Error('Invalid Google Sheet URL')

  const accessToken = await getGoogleAccessToken(serviceAccountJson)

  const values = rows.map(row => columns.map(col => {
    const val = row[col.name]
    return val === null || val === undefined ? '' : val
  }))

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
