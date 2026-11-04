import {PrismaClient} from '@prisma/client';
import {PrismaNeon} from '@prisma/adapter-neon';
import {neonConfig} from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor=ws;
const globalDb=globalThis as unknown as {prumoPrisma?:PrismaClient};
const createClient=()=>new PrismaClient({adapter:new PrismaNeon({connectionString:process.env.DATABASE_URL})});
export const prisma=globalDb.prumoPrisma??createClient();
if(process.env.NODE_ENV!=='production')globalDb.prumoPrisma=prisma;
