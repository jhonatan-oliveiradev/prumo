import type {Metadata} from 'next';
import {PRIVATE_ROBOTS} from '@/lib/seo';
import {AuthScreen} from '@/components/auth-screen';
import {cloudEnabled} from '@/lib/server/auth';

export const metadata: Metadata = {
  title: 'Entrar na conta',
  description: 'Acesse sua conta do Prumo e continue organizando suas finanças.',
  robots: PRIVATE_ROBOTS,
};
export const dynamic = 'force-dynamic';
export default function Login() { return <AuthScreen signup={false} enabled={cloudEnabled()} />; }
