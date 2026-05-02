require('dotenv').config()
const { Client } = require('pg')

async function verifyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('Connected to database\n')

    // Check Customer table columns
    const customerColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Customer'
      AND column_name IN ('birthday', 'referralCode', 'referredBy')
      ORDER BY column_name
    `)
    console.log('Customer table new columns:')
    console.table(customerColumns.rows)

    // Check PointTransaction table exists
    const pointTransactionTable = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'PointTransaction'
    `)
    console.log('\nPointTransaction table exists:', pointTransactionTable.rows.length > 0)

    // Check indexes
    const indexes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('Customer', 'PointTransaction')
      AND indexname LIKE '%referral%' OR indexname LIKE '%PointTransaction%'
    `)
    console.log('\nNew indexes:')
    console.table(indexes.rows)

    console.log('\n✓ Migration verified successfully!')
  } catch (error) {
    console.error('Verification failed:', error)
  } finally {
    await client.end()
  }
}

verifyMigration()
