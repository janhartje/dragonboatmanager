import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration...');

  // 1. Create Default Team if not exists
  let defaultTeam = await prisma.team.findFirst({
    where: { name: 'Drachenboot' },
  });

  if (!defaultTeam) {
    console.log('Creating default team "Drachenboot"...');
    defaultTeam = await prisma.team.create({
      data: { name: 'Drachenboot' },
    });
  } else {
    console.log('Default team "Drachenboot" already exists.');
  }

  // 2. Assign Paddlers
  const paddlersWithoutTeam = await prisma.paddler.count({
    where: { teamId: null },
  });

  if (paddlersWithoutTeam > 0) {
    console.log(`Assigning ${paddlersWithoutTeam} paddlers to default team...`);
    await prisma.paddler.updateMany({
      where: { teamId: null },
      data: { teamId: defaultTeam.id },
    });
  } else {
    console.log('No paddlers to migrate.');
  }

  // 3. Assign Events
  const eventsWithoutTeam = await prisma.event.count({
    where: { teamId: null },
  });

  if (eventsWithoutTeam > 0) {
    console.log(`Assigning ${eventsWithoutTeam} events to default team...`);
    await prisma.event.updateMany({
      where: { teamId: null },
      data: { teamId: defaultTeam.id },
    });
  } else {
    console.log('No events to migrate.');
  }

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
