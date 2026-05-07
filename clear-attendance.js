const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://neondb_owner:npg_YgLuCh7w8dyS@ep-muddy-tree-ao4oslno-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
})

async function main() {
  console.log('Deleting all attendance records...')
  
  const result = await prisma.attendance.deleteMany({})
  
  console.log(`Deleted ${result.count} attendance records`)
  
  await prisma.auditLog.deleteMany({
    where: { entity: 'Attendance' }
  })
  
  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
