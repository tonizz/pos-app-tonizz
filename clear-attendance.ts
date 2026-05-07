import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all attendance records...')
  
  const result = await prisma.attendance.deleteMany({})
  
  console.log(`Deleted ${result.count} attendance records`)
  
  // Also delete related audit logs
  const auditResult = await prisma.auditLog.deleteMany({
    where: {
      entity: 'Attendance'
    }
  })
  
  console.log(`Deleted ${auditResult.count} audit logs`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
