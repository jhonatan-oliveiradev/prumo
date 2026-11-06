import {AuthScreen} from '@/components/auth-screen';
import {cloudEnabled} from '@/lib/server/auth';

export const metadata = {title: 'Entrar | Prumo'};
export const dynamic = 'force-dynamic';
export default function Login() { return <AuthScreen signup={false} enabled={cloudEnabled()} />; }
