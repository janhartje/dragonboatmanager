import 'dotenv/config';
import { defineConfig } from "prisma/config";


export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    url: (process.env.POSTGRES_URL || process.env.DATABASE_URL) as any,
  },
});
