import type {Metadata} from 'next';
import {PRIVATE_ROBOTS} from '@/lib/seo';

/** The financial workspace is not public content, even in local-first mode. */
export const metadata: Metadata = {
  title: 'Seu espaço financeiro',
  robots: PRIVATE_ROBOTS,
};

export default function FinanceWorkspaceLayout({children}: {children: React.ReactNode}) {
  return children;
}
