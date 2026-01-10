
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding database...');

    const seedEmailsRaw = process.env.SEED_EMAILS || 'test1@dragonboatmanager.com,test2@dragonboatmanager.com';
    const emails = seedEmailsRaw.split(',').map(e => e.trim()).filter(Boolean);

    const users = emails.map(email => ({
        email,
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
    }));

    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: userData,
        });

        console.log(`Created/Updated user: ${user.email}`);

        // Create a PRO team for each user
        const proTeam = await prisma.team.create({
            data: {
                name: `${userData.name}'s PRO Dragons`,
                plan: 'PRO',
                primaryColor: 'amber',
                showProRing: true,
                paddlers: {
                    create: {
                        name: userData.name,
                        weight: 85,
                        role: 'CAPTAIN',
                        userId: user.id,
                        skills: ['left', 'right', 'steer'],
                    }
                }
            },
        });

        // Add some random paddlers to PRO team
        await prisma.paddler.createMany({
            data: [
                { name: 'Paddler A', weight: 70, teamId: proTeam.id, skills: ['left'] },
                { name: 'Paddler B', weight: 95, teamId: proTeam.id, skills: ['right'] },
                { name: 'Drummer X', weight: 55, teamId: proTeam.id, skills: ['drum'] },
            ]
        });

        // Create a FREE team for each user
        await prisma.team.create({
            data: {
                name: `${userData.name}'s FREE Club`,
                plan: 'FREE',
                paddlers: {
                    create: {
                        name: userData.name,
                        weight: 85,
                        role: 'CAPTAIN',
                        userId: user.id,
                        skills: ['left', 'right'],
                    }
                }
            },
        });

        console.log(`Created teams for ${user.email}`);
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
