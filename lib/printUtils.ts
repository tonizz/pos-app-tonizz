import jsPDF from 'jspdf'

interface ReceiptData {
  invoiceNo: string
  date: string
  cashier: string
  customer?: string
  items: Array<{
    name: string
    quantity: number
    price: number
    discount: number
    subtotal: number
  }>
  subtotal: number
  discount: number
  tax: number
  taxRate?: number
  taxType?: string
  total: number
  payments: Array<{
    method: string
    amount: number
  }>
  change: number
  store?: {
    name: string
    address?: string
    phone?: string
  }
}

export const printReceipt = (data: ReceiptData) => {
  try {
    const printWindow = window.open('', '_blank', 'width=300,height=600')

    if (!printWindow) {
      // Fallback: print in same window
      const html = generateReceiptHTML(data)
      const printFrame = document.createElement('iframe')
      printFrame.style.display = 'none'
      document.body.appendChild(printFrame)

      const doc = printFrame.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()

        printFrame.contentWindow?.focus()
        printFrame.contentWindow?.print()

        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 1000)
      }
      return
    }

    const html = generateReceiptHTML(data)

    printWindow.document.write(html)
    printWindow.document.close()

    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
      // Close after printing (optional)
      // printWindow.close()
    }
  } catch (error) {
    console.error('Print error:', error)
    throw new Error('Failed to open print window. Please check your browser popup settings.')
  }
}

export const printReceiptPDF = (data: ReceiptData) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200] // Thermal printer width (80mm)
  })

  let y = 10

  // Store info
  if (data.store) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(data.store.name, 40, y, { align: 'center' })
    y += 5

    if (data.store.address) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      const addressLines = doc.splitTextToSize(data.store.address, 70)
      doc.text(addressLines, 40, y, { align: 'center' })
      y += addressLines.length * 3
    }

    if (data.store.phone) {
      doc.setFontSize(8)
      doc.text(data.store.phone, 40, y, { align: 'center' })
      y += 5
    }
  }

  // Separator
  doc.text('='.repeat(40), 5, y)
  y += 5

  // Invoice info
  doc.setFontSize(9)
  doc.text(`Invoice: ${data.invoiceNo}`, 5, y)
  y += 4
  doc.text(`Date: ${new Date(data.date).toLocaleString('id-ID')}`, 5, y)
  y += 4
  doc.text(`Cashier: ${data.cashier}`, 5, y)
  y += 4

  if (data.customer) {
    doc.text(`Customer: ${data.customer}`, 5, y)
    y += 4
  }

  // Separator
  doc.text('-'.repeat(40), 5, y)
  y += 5

  // Items
  doc.setFontSize(8)
  data.items.forEach(item => {
    // Item name
    const nameLines = doc.splitTextToSize(item.name, 60)
    doc.text(nameLines, 5, y)
    y += nameLines.length * 3

    // Quantity x Price
    doc.text(`${item.quantity} x ${formatCurrency(item.price)}`, 5, y)
    doc.text(formatCurrency(item.subtotal), 75, y, { align: 'right' })
    y += 4

    // Discount if any
    if (item.discount > 0) {
      doc.text(`  Discount`, 5, y)
      doc.text(`-${formatCurrency(item.discount * item.quantity)}`, 75, y, { align: 'right' })
      y += 4
    }
  })

  // Separator
  doc.text('-'.repeat(40), 5, y)
  y += 5

  // Totals
  doc.setFontSize(9)
  doc.text('Subtotal', 5, y)
  doc.text(formatCurrency(data.subtotal), 75, y, { align: 'right' })
  y += 4

  if (data.discount > 0) {
    doc.text('Discount', 5, y)
    doc.text(`-${formatCurrency(data.discount)}`, 75, y, { align: 'right' })
    y += 4
  }

  if (data.tax > 0) {
    const taxLabel = `Tax${data.taxRate ? ` (${data.taxRate}%)` : ''}${data.taxType === 'INCLUSIVE' ? ' (included)' : ''}`
    doc.text(taxLabel, 5, y)
    doc.text(formatCurrency(data.tax), 75, y, { align: 'right' })
    y += 4
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('TOTAL', 5, y)
  doc.text(formatCurrency(data.total), 75, y, { align: 'right' })
  y += 6

  // Payments
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  data.payments.forEach(payment => {
    doc.text(payment.method, 5, y)
    doc.text(formatCurrency(payment.amount), 75, y, { align: 'right' })
    y += 4
  })

  if (data.change > 0) {
    doc.text('Change', 5, y)
    doc.text(formatCurrency(data.change), 75, y, { align: 'right' })
    y += 6
  }

  // Footer
  doc.text('='.repeat(40), 5, y)
  y += 5
  doc.setFontSize(8)
  doc.text('Thank you for your purchase!', 40, y, { align: 'center' })

  // Save or print
  doc.autoPrint()
  window.open(doc.output('bloburl'), '_blank')
}

const generateReceiptHTML = (data: ReceiptData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${data.invoiceNo}</title>
      <style>
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }

        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          max-width: 80mm;
          margin: 0 auto;
          padding: 10px;
        }

        .header {
          text-align: center;
          margin-bottom: 10px;
        }

        .store-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .store-info {
          font-size: 10px;
          margin-bottom: 2px;
        }

        .separator {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 11px;
        }

        .item {
          margin-bottom: 8px;
        }

        .item-name {
          font-weight: bold;
          margin-bottom: 2px;
        }

        .item-detail {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        .totals {
          margin-top: 10px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }

        .grand-total {
          font-size: 14px;
          font-weight: bold;
          border-top: 2px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }

        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${data.store ? `
          <div class="store-name">${data.store.name}</div>
          ${data.store.address ? `<div class="store-info">${data.store.address}</div>` : ''}
          ${data.store.phone ? `<div class="store-info">${data.store.phone}</div>` : ''}
        ` : ''}
      </div>

      <div class="separator"></div>

      <div class="info-row">
        <span>Invoice:</span>
        <span>${data.invoiceNo}</span>
      </div>
      <div class="info-row">
        <span>Date:</span>
        <span>${new Date(data.date).toLocaleString('id-ID')}</span>
      </div>
      <div class="info-row">
        <span>Cashier:</span>
        <span>${data.cashier}</span>
      </div>
      ${data.customer ? `
        <div class="info-row">
          <span>Customer:</span>
          <span>${data.customer}</span>
        </div>
      ` : ''}

      <div class="separator"></div>

      ${data.items.map(item => `
        <div class="item">
          <div class="item-name">${item.name}</div>
          <div class="item-detail">
            <span>${item.quantity} x ${formatCurrency(item.price)}</span>
            <span>${formatCurrency(item.subtotal)}</span>
          </div>
          ${item.discount > 0 ? `
            <div class="item-detail">
              <span>&nbsp;&nbsp;Discount</span>
              <span>-${formatCurrency(item.discount * item.quantity)}</span>
            </div>
          ` : ''}
        </div>
      `).join('')}

      <div class="separator"></div>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </div>
        ${data.discount > 0 ? `
          <div class="total-row">
            <span>Discount</span>
            <span>-${formatCurrency(data.discount)}</span>
          </div>
        ` : ''}
        ${data.tax > 0 ? `
          <div class="total-row">
            <span>Tax${data.taxRate ? ` (${data.taxRate}%)` : ''}${data.taxType === 'INCLUSIVE' ? ' (included)' : ''}</span>
            <span>${formatCurrency(data.tax)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
      </div>

      <div class="separator"></div>

      ${data.payments.map(payment => `
        <div class="total-row">
          <span>${payment.method}</span>
          <span>${formatCurrency(payment.amount)}</span>
        </div>
      `).join('')}

      ${data.change > 0 ? `
        <div class="total-row">
          <span>Change</span>
          <span>${formatCurrency(data.change)}</span>
        </div>
      ` : ''}

      <div class="separator"></div>

      <div class="footer">
        Thank you for your purchase!<br>
        Please come again
      </div>
    </body>
    </html>
  `
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}
