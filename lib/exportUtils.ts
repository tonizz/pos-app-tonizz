import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface ReportData {
  summary: {
    totalRevenue: number
    totalTransactions: number
    totalDiscount: number
    totalTax: number
    totalProfit: number
    averageTransaction: number
  }
  dailySales: Array<{
    date: string
    revenue: number
    transactions: number
  }>
  topProducts: Array<{
    productId: string
    name: string
    quantity: number
    revenue: number
  }>
  paymentMethods: Array<{
    method: string
    amount: number
  }>
}

export const exportReportToPDF = (
  reportData: ReportData,
  startDate: string,
  endDate: string,
  warehouseName?: string
) => {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text('Sales Report', 14, 20)

  // Date range
  doc.setFontSize(10)
  doc.text(`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 28)
  if (warehouseName) {
    doc.text(`Warehouse: ${warehouseName}`, 14, 34)
  }

  let yPos = warehouseName ? 42 : 36

  // Summary section
  doc.setFontSize(14)
  doc.text('Summary', 14, yPos)
  yPos += 8

  const summaryData = [
    ['Total Revenue', formatCurrency(reportData.summary.totalRevenue)],
    ['Total Transactions', reportData.summary.totalTransactions.toString()],
    ['Total Discount', formatCurrency(reportData.summary.totalDiscount)],
    ['Total Tax', formatCurrency(reportData.summary.totalTax)],
    ['Total Profit', formatCurrency(reportData.summary.totalProfit)],
    ['Average Transaction', formatCurrency(reportData.summary.averageTransaction)]
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  })

  // Top Products section
  yPos = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(14)
  doc.text('Top Products', 14, yPos)
  yPos += 8

  const topProductsData = reportData.topProducts.map((p, i) => [
    (i + 1).toString(),
    p.name,
    p.quantity.toString(),
    formatCurrency(p.revenue)
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Product', 'Quantity', 'Revenue']],
    body: topProductsData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  })

  // Payment Methods section
  yPos = (doc as any).lastAutoTable.finalY + 10

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(14)
  doc.text('Payment Methods', 14, yPos)
  yPos += 8

  const paymentMethodsData = reportData.paymentMethods.map(pm => [
    pm.method,
    formatCurrency(pm.amount)
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Method', 'Amount']],
    body: paymentMethodsData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }
  })

  // Daily Sales section
  if (reportData.dailySales.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 10

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.text('Daily Sales', 14, yPos)
    yPos += 8

    const dailySalesData = reportData.dailySales.map(ds => [
      formatDate(ds.date),
      ds.transactions.toString(),
      formatCurrency(ds.revenue)
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Transactions', 'Revenue']],
      body: dailySalesData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    })
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Save
  const filename = `sales-report-${startDate}-to-${endDate}.pdf`
  doc.save(filename)
}

export const exportReportToExcel = (
  reportData: ReportData,
  startDate: string,
  endDate: string,
  warehouseName?: string
) => {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['Sales Report'],
    [`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`],
    warehouseName ? [`Warehouse: ${warehouseName}`] : [],
    [],
    ['Summary'],
    ['Metric', 'Value'],
    ['Total Revenue', reportData.summary.totalRevenue],
    ['Total Transactions', reportData.summary.totalTransactions],
    ['Total Discount', reportData.summary.totalDiscount],
    ['Total Tax', reportData.summary.totalTax],
    ['Total Profit', reportData.summary.totalProfit],
    ['Average Transaction', reportData.summary.averageTransaction]
  ].filter(row => row.length > 0)

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Top Products sheet
  const topProductsData = [
    ['Top Products'],
    [],
    ['#', 'Product', 'Quantity', 'Revenue'],
    ...reportData.topProducts.map((p, i) => [
      i + 1,
      p.name,
      p.quantity,
      p.revenue
    ])
  ]

  const topProductsSheet = XLSX.utils.aoa_to_sheet(topProductsData)
  XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Top Products')

  // Payment Methods sheet
  const paymentMethodsData = [
    ['Payment Methods'],
    [],
    ['Method', 'Amount'],
    ...reportData.paymentMethods.map(pm => [pm.method, pm.amount])
  ]

  const paymentMethodsSheet = XLSX.utils.aoa_to_sheet(paymentMethodsData)
  XLSX.utils.book_append_sheet(workbook, paymentMethodsSheet, 'Payment Methods')

  // Daily Sales sheet
  if (reportData.dailySales.length > 0) {
    const dailySalesData = [
      ['Daily Sales'],
      [],
      ['Date', 'Transactions', 'Revenue'],
      ...reportData.dailySales.map(ds => [
        formatDate(ds.date),
        ds.transactions,
        ds.revenue
      ])
    ]

    const dailySalesSheet = XLSX.utils.aoa_to_sheet(dailySalesData)
    XLSX.utils.book_append_sheet(workbook, dailySalesSheet, 'Daily Sales')
  }

  // Save
  const filename = `sales-report-${startDate}-to-${endDate}.xlsx`
  XLSX.writeFile(workbook, filename)
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Export Transactions to Excel
export const exportTransactionsToExcel = (transactions: any[]) => {
  const data = transactions.map(t => ({
    'Invoice No': t.invoiceNo,
    'Date': new Date(t.createdAt).toLocaleString('id-ID'),
    'Customer': t.customer?.name || 'Guest',
    'Cashier': t.cashier?.name || '-',
    'Subtotal': t.subtotal,
    'Discount': t.discount,
    'Tax': t.tax,
    'Total': t.total,
    'Payment Method': t.paymentMethod,
    'Paid Amount': t.paidAmount,
    'Change': t.changeAmount,
    'Status': t.status,
    'Notes': t.notes || '-'
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

  const filename = `transactions-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}

// Export Transactions to CSV
export const exportTransactionsToCSV = (transactions: any[]) => {
  const data = transactions.map(t => ({
    'Invoice No': t.invoiceNo,
    'Date': new Date(t.createdAt).toLocaleString('id-ID'),
    'Customer': t.customer?.name || 'Guest',
    'Cashier': t.cashier?.name || '-',
    'Subtotal': t.subtotal,
    'Discount': t.discount,
    'Tax': t.tax,
    'Total': t.total,
    'Payment Method': t.paymentMethod,
    'Paid Amount': t.paidAmount,
    'Change': t.changeAmount,
    'Status': t.status,
    'Notes': t.notes || '-'
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Export Products to Excel
export const exportProductsToExcel = (products: any[]) => {
  const data = products.map(p => ({
    'SKU': p.sku,
    'Barcode': p.barcode || '-',
    'Name': p.name,
    'Category': p.category?.name || '-',
    'Unit': p.unit,
    'Buy Price': p.buyPrice || 0,
    'Sell Price': p.sellPrice,
    'Wholesale Price': p.wholesalePrice || '-',
    'Stock': p.stocks?.[0]?.quantity || 0,
    'Min Stock': p.stocks?.[0]?.minStock || 0,
    'Warehouse': p.stocks?.[0]?.warehouse?.name || '-',
    'Status': p.isActive ? 'Active' : 'Inactive'
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')

  const filename = `products-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}

// Export Products to CSV
export const exportProductsToCSV = (products: any[]) => {
  const data = products.map(p => ({
    'SKU': p.sku,
    'Barcode': p.barcode || '-',
    'Name': p.name,
    'Category': p.category?.name || '-',
    'Unit': p.unit,
    'Buy Price': p.buyPrice || 0,
    'Sell Price': p.sellPrice,
    'Wholesale Price': p.wholesalePrice || '-',
    'Stock': p.stocks?.[0]?.quantity || 0,
    'Min Stock': p.stocks?.[0]?.minStock || 0,
    'Warehouse': p.stocks?.[0]?.warehouse?.name || '-',
    'Status': p.isActive ? 'Active' : 'Inactive'
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Export Customers to Excel
export const exportCustomersToExcel = (customers: any[]) => {
  const data = customers.map(c => ({
    'Name': c.name,
    'Phone': c.phone || '-',
    'Email': c.email || '-',
    'Address': c.address || '-',
    'Member Tier': c.memberTier,
    'Points': c.points,
    'Total Spent': c.totalSpent,
    'Credit Limit': c.creditLimit,
    'Credit Balance': c.creditBalance,
    'Registered': new Date(c.createdAt).toLocaleDateString('id-ID')
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Customers')

  const filename = `customers-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}

// Export Customers to CSV
export const exportCustomersToCSV = (customers: any[]) => {
  const data = customers.map(c => ({
    'Name': c.name,
    'Phone': c.phone || '-',
    'Email': c.email || '-',
    'Address': c.address || '-',
    'Member Tier': c.memberTier,
    'Points': c.points,
    'Total Spent': c.totalSpent,
    'Credit Limit': c.creditLimit,
    'Credit Balance': c.creditBalance,
    'Registered': new Date(c.createdAt).toLocaleDateString('id-ID')
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `customers-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
