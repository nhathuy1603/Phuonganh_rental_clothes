import 'dotenv/config'
import { PrismaClient, type Prisma } from '@prisma/client'
import { defaultCategoryTree, makeupCategories, products, bookings, makeupAppointments } from '../../src/data/seed-data.js'

const prisma = new PrismaClient()

async function main() {
  const groups = defaultCategoryTree()

  for (const [sortOrder, group] of groups.entries()) {
    const savedGroup = await prisma.categoryGroup.upsert({
      where: { name: group.group },
      create: { name: group.group, sortOrder },
      update: { sortOrder },
    })

    for (const [categoryOrder, name] of group.items.entries()) {
      await prisma.category.upsert({
        where: { name },
        create: { name, groupId: savedGroup.id, sortOrder: categoryOrder },
        update: { groupId: savedGroup.id, sortOrder: categoryOrder },
      })
    }
  }

  for (const product of products) {
    const fields = {
      name: product.name,
      category: { connect: { name: product.category } },
      icon: product.icon,
      pricePerDay: product.pricePerDay,
      deposit: product.deposit,
      depositNote: product.depositNote,
      desc: product.desc,
      colorHex: product.colorHex as Prisma.InputJsonValue,
      images: product.images,
      videoUrl: product.videoUrl,
    }
    const variants = product.variants.map((variant) => ({ ...variant }))

    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        ...fields,
        variants: { create: variants },
      },
      update: {
        ...fields,
        variants: { deleteMany: {}, create: variants },
      },
    })
  }

  for (const booking of bookings) {
    const { id, ...fields } = booking
    await prisma.rentalBooking.upsert({
      where: { id },
      create: booking,
      update: fields,
    })
  }

  for (const service of makeupCategories) {
    const { id, ...fields } = service
    await prisma.makeupService.upsert({
      where: { id },
      create: service,
      update: fields,
    })
  }

  for (const appointment of makeupAppointments) {
    const { id, ...fields } = appointment
    await prisma.makeupAppointment.upsert({
      where: { id },
      create: appointment,
      update: fields,
    })
  }

  console.log('Database seed completed.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
