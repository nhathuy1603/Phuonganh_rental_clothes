import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { makeupCategories } from '../../src/data/seed-data.js'

const prisma = new PrismaClient()

async function main() {
  let restored = 0

  for (const service of makeupCategories) {
    const existing = await prisma.makeupService.findUnique({ where: { id: service.id } })
    if (existing) continue

    await prisma.makeupService.create({ data: service })
    restored += 1
  }

  console.log(`Restored ${restored} missing makeup services.`)
}

main()
  .catch((error) => {
    console.error('Could not restore makeup services. Check DATABASE_URL.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
