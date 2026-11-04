import {betterAuth} from 'better-auth';
import {prismaAdapter} from 'better-auth/adapters/prisma';
import {nextCookies} from 'better-auth/next-js';
import {prisma} from './prisma';
export const cloudEnabled = () => Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_URL);
const createAuth=()=>betterAuth({
 appName:'Prumo',baseURL:process.env.BETTER_AUTH_URL,secret:process.env.BETTER_AUTH_SECRET,
 database:prismaAdapter(prisma,{provider:'postgresql'}),
 account:{modelName:'authAccount'},
 emailAndPassword:{enabled:true,minPasswordLength:12,maxPasswordLength:128},
 session:{expiresIn:60*60*24*7,updateAge:60*60*24},
 rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:5},'/sign-up/email':{window:60,max:3}}},
 plugins:[nextCookies()],
});
let instance:ReturnType<typeof createAuth>|undefined;
export function getAuth(){if(!cloudEnabled())throw Error('Cloud is not configured');return instance??=createAuth();}
