import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'POS App <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    })

    return { success: true, data }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

// Email Templates
export function generateReceiptEmail(transaction: any) {
  const items = transaction.items.map((item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">Rp ${item.price.toLocaleString()}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">Rp ${item.subtotal.toLocaleString()}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - ${transaction.invoiceNo}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1a1a1a; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">POS Application</h1>
        <p style="margin: 5px 0;">Thank you for your purchase!</p>
      </div>

      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #333;">Receipt #${transaction.invoiceNo}</h2>
        <p style="color: #666;">Date: ${new Date(transaction.createdAt).toLocaleString('id-ID')}</p>
        ${transaction.customer ? `<p style="color: #666;">Customer: ${transaction.customer.name}</p>` : ''}

        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
          <thead>
            <tr style="background: #333; color: white;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items}
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 5px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Subtotal:</span>
            <strong>Rp ${transaction.subtotal.toLocaleString()}</strong>
          </div>
          ${transaction.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #e74c3c;">
            <span>Discount:</span>
            <strong>- Rp ${transaction.discount.toLocaleString()}</strong>
          </div>
          ` : ''}
          ${transaction.tax > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Tax (${transaction.taxRate}% ${transaction.taxType}):</span>
            <strong>Rp ${transaction.tax.toLocaleString()}</strong>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #333; font-size: 18px;">
            <span><strong>Total:</strong></span>
            <strong style="color: #27ae60;">Rp ${transaction.total.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <span>Paid:</span>
            <strong>Rp ${transaction.paidAmount.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Change:</span>
            <strong>Rp ${transaction.changeAmount.toLocaleString()}</strong>
          </div>
        </div>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; text-align: center;">
          <p style="margin: 0; color: #856404;">Payment Method: <strong>${transaction.paymentMethod}</strong></p>
        </div>
      </div>

      <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated email. Please do not reply.</p>
        <p>© 2026 POS Application. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export function generateDailySalesReport(data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Sales Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1a1a1a; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Daily Sales Report</h1>
        <p style="margin: 5px 0;">${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div style="padding: 20px; background: #f9f9f9;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div style="background: white; padding: 15px; border-radius: 5px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">Total Sales</p>
            <h2 style="margin: 10px 0; color: #27ae60;">Rp ${data.totalSales.toLocaleString()}</h2>
          </div>
          <div style="background: white; padding: 15px; border-radius: 5px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">Transactions</p>
            <h2 style="margin: 10px 0; color: #3498db;">${data.totalTransactions}</h2>
          </div>
        </div>

        <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <h3 style="margin-top: 0; color: #333;">Top Products</h3>
          ${data.topProducts.map((p: any, i: number) => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span>${i + 1}. ${p.name}</span>
              <strong>${p.quantity} sold</strong>
            </div>
          `).join('')}
        </div>

        <div style="background: white; padding: 15px; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">Payment Methods</h3>
          ${Object.entries(data.paymentMethods).map(([method, amount]: [string, any]) => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span>${method}</span>
              <strong>Rp ${amount.toLocaleString()}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated daily report.</p>
        <p>© 2026 POS Application. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

export function generateLowStockAlert(products: any[]) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Low Stock Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #e74c3c; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">⚠️ Low Stock Alert</h1>
        <p style="margin: 5px 0;">Some products are running low on stock</p>
      </div>

      <div style="padding: 20px; background: #f9f9f9;">
        <p style="color: #666;">The following products need to be restocked:</p>

        <table style="width: 100%; margin-top: 20px; border-collapse: collapse; background: white;">
          <thead>
            <tr style="background: #333; color: white;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Current Stock</th>
              <th style="padding: 10px; text-align: center;">Min Stock</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #e74c3c;"><strong>${p.currentStock}</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.minStock}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
          <p style="margin: 0; color: #856404;"><strong>Action Required:</strong> Please restock these products as soon as possible to avoid stockouts.</p>
        </div>
      </div>

      <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>This is an automated alert.</p>
        <p>© 2026 POS Application. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}
