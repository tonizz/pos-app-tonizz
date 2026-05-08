import crypto from 'crypto'

const BASE_URL = 'https://api.mekari.com'
const CLIENT_ID = process.env.JURNAL_CLIENT_ID!
const CLIENT_SECRET = process.env.JURNAL_CLIENT_SECRET!

function buildHmacHeaders(method: string, path: string, body?: object) {
  const date = new Date().toUTCString()
  const requestLine = `${method.toUpperCase()} ${path} HTTP/1.1`
  const signingString = `date: ${date}\n${requestLine}`

  const signature = crypto
    .createHmac('sha256', CLIENT_SECRET)
    .update(signingString)
    .digest('base64')

  const authorization =
    `hmac username="${CLIENT_ID}", algorithm="hmac-sha256", ` +
    `headers="date request-line", signature="${signature}"`

  const headers: Record<string, string> = {
    Authorization: authorization,
    Date: date,
    'Content-Type': 'application/json',
  }

  // Digest header wajib untuk POST/PUT/PATCH
  if (body) {
    const bodyStr = JSON.stringify(body)
    const digest = crypto.createHash('sha256').update(bodyStr).digest('base64')
    headers['Digest'] = `SHA-256=${digest}`
  }

  return headers
}

async function jurnalRequest<T>(
  method: string,
  path: string,
  body?: object
): Promise<T> {
  const headers = buildHmacHeaders(method, path, body)
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Jurnal API error ${res.status}: ${JSON.stringify(data)}`)
  }
  return data as T
}

// ── Sales Invoice ─────────────────────────────────────────────────────────────

export interface JurnalSalesInvoicePayload {
  sales_invoice: {
    transaction_date: string       // YYYY-MM-DD
    due_date: string
    transaction_no: string         // nomor invoice POS
    memo?: string
    person_name?: string           // nama customer
    transaction_lines_attributes: {
      product_name: string
      quantity: number
      rate: number                 // harga satuan
      description?: string
    }[]
  }
}

export async function createSalesInvoice(payload: JurnalSalesInvoicePayload) {
  return jurnalRequest<any>(
    'POST',
    '/jurnal/api/v1/sales_invoices',
    payload
  )
}

// ── Helper: konversi transaksi POS ke payload Jurnal ─────────────────────────

export function transactionToJurnalPayload(
  transaction: any
): JurnalSalesInvoicePayload {
  const date = new Date(transaction.createdAt).toISOString().split('T')[0]

  return {
    sales_invoice: {
      transaction_date: date,
      due_date: date,
      transaction_no: transaction.invoiceNo,
      memo: `POS Transaction - ${transaction.invoiceNo}`,
      person_name: transaction.customer?.name ?? 'Walk-in Customer',
      transaction_lines_attributes: transaction.items.map((item: any) => ({
        product_name: item.product.name,
        quantity: item.quantity,
        rate: item.price,
        description: item.product.sku ?? '',
      })),
    },
  }
}
