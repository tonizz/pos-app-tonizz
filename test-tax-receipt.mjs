// Test script untuk verifikasi tax di receipt
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function testTaxReceipt() {
  console.log('=== Testing Tax Receipt ===\n')

  // 1. Check tax settings
  console.log('1. Checking tax settings...')
  const taxSettings = await prisma.taxSetting.findMany({
    where: { isActive: true }
  })
  console.log(`   Found ${taxSettings.length} active tax settings`)
  if (taxSettings.length > 0) {
    taxSettings.forEach(tax => {
      console.log(`   - ${tax.name}: ${tax.rate}% (${tax.type})`)
    })
  } else {
    console.log('   ⚠️  No active tax settings found!')
  }

  // 2. Check recent transactions
  console.log('\n2. Checking recent transactions...')
  const transactions = await prisma.transaction.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      invoiceNo: true,
      tax: true,
      taxRate: true,
      taxType: true,
      total: true,
      createdAt: true
    }
  })

  console.log(`   Found ${transactions.length} recent transactions:\n`)
  transactions.forEach((tx, i) => {
    console.log(`   ${i + 1}. Invoice: ${tx.invoiceNo}`)
    console.log(`      Tax: Rp ${tx.tax.toLocaleString()}`)
    console.log(`      Tax Rate: ${tx.taxRate}%`)
    console.log(`      Tax Type: ${tx.taxType}`)
    console.log(`      Total: Rp ${tx.total.toLocaleString()}`)
    console.log(`      Created: ${tx.createdAt.toLocaleString()}`)

    // Check if tax data is complete
    if (tx.tax > 0 && (!tx.taxRate || !tx.taxType)) {
      console.log(`      ⚠️  WARNING: Tax amount exists but taxRate/taxType is missing!`)
    } else if (tx.tax > 0 && tx.taxRate && tx.taxType) {
      console.log(`      ✅ Tax data complete - will show in receipt`)
    } else {
      console.log(`      ℹ️  No tax applied`)
    }
    console.log('')
  })

  // 3. Summary
  console.log('=== Summary ===')
  const txWithTax = transactions.filter(tx => tx.tax > 0)
  const txWithCompleteTax = txWithTax.filter(tx => tx.taxRate && tx.taxType)

  console.log(`Total transactions checked: ${transactions.length}`)
  console.log(`Transactions with tax: ${txWithTax.length}`)
  console.log(`Transactions with complete tax data: ${txWithCompleteTax.length}`)

  if (txWithTax.length > txWithCompleteTax.length) {
    console.log('\n⚠️  ISSUE FOUND:')
    console.log(`   ${txWithTax.length - txWithCompleteTax.length} transaction(s) have tax amount but missing taxRate/taxType`)
    console.log('   These transactions will NOT show tax in receipt!')
    console.log('\n💡 SOLUTION:')
    console.log('   Create a NEW transaction after the fix to test.')
    console.log('   Old transactions need manual update if you want to fix them.')
  } else if (txWithCompleteTax.length > 0) {
    console.log('\n✅ All transactions with tax have complete data!')
    console.log('   Tax should show in receipt for these transactions.')
  } else {
    console.log('\nℹ️  No transactions with tax found.')
    console.log('   Create a transaction with tax enabled to test.')
  }

  await prisma.$disconnect()
}

testTaxReceipt().catch(console.error)
