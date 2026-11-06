import type {Metadata} from 'next';
import {PRIVATE_ROBOTS} from '@/lib/seo';
import {RecoveryScreen} from '@/components/recovery-screen';
export const metadata: Metadata = {title: 'Página não encontrada', robots: PRIVATE_ROBOTS};

export default function NotFound(){return <RecoveryScreen notFound/>}
