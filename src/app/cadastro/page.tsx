import type {Metadata} from 'next';
import {PRIVATE_ROBOTS} from '@/lib/seo';
import {AuthScreen} from '@/components/auth-screen';
import {cloudEnabled} from '@/lib/server/auth';

export const metadata: Metadata = {
  title: 'Criar conta',
  description: 'Crie sua conta no Prumo para acessar seus registros sincronizados.',
  robots: PRIVATE_ROBOTS,
};
export const dynamic = 'force-dynamic';
export default function Cadastro() { return <AuthScreen signup enabled={cloudEnabled()} />; }
