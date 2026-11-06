'use client';

import {RecoveryScreen} from '@/components/recovery-screen';

export default function GlobalError({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  return <html lang="pt-BR"><body style={{margin: 0, background: '#030504'}}><RecoveryScreen retry={reset} /></body></html>;
}
