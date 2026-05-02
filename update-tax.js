const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function updateStoreTax() {
  try {
    console.log('Updating store tax settings...')
    
    const result = await pool.query(`
      UPDATE "Store" 
      SET "taxRate" = 11, 
          "taxInclusive" = true 
      WHERE id IS NOT NULL
      RETURNING *
    `)
    
    if (result.rows.length > 0) {
      console.log('✅ Store tax settings updated!')
      console.log('Tax Rate:', result.rows[0].taxRate + '%')
      console.log('Tax Inclusive:', result.rows[0].taxInclusive)
    } else {
      console.log('⚠️  No store found. Creating default store...')
      
      const createResult = await pool.query(`
        INSERT INTO "Store" (id, name, "taxRate", "taxInclusive")
        VALUES (gen_random_uuid(), 'My Store', 11, true)
        RETURNING *
      `)
      
      console.log('✅ Store created with tax settings!')
      console.log('Tax Rate:', createResult.rows[0].taxRate + '%')
      console.log('Tax Inclusive:', createResult.rows[0].taxInclusive)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

updateStoreTax()
