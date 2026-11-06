import {AuthScreen} from '@/components/auth-screen';
import {cloudEnabled} from '@/lib/server/auth';

export const metadata = {title: 'Criar conta | Prumo'};
export const dynamic = 'force-dynamic';
export default function Cadastro() { return <AuthScreen signup enabled={cloudEnabled()} />; }
