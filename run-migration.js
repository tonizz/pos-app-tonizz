require('dotenv').config()
const { Client } = require('pg')
const fs = require('fs')

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    await client.connect()
    console.log('Connected to database')

    const sql = fs.readFileSync('migration-loyalty.sql', 'utf8')
    await client.query(sql)

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
