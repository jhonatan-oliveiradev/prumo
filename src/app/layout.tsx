import {LaunchProvider} from '@/components/launch-provider';
import {ConfirmationProvider} from '@/components/confirmation-provider';
import type { Metadata, Viewport } from 'next';
import {
  IS_PRODUCTION, SITE_URL, SITE_NAME, SITE_TITLE,
  SITE_DESCRIPTION, SOCIAL_TITLE, SOCIAL_DESCRIPTION,
  SOCIAL_IMAGE_URL, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_ALT,
} from '@/lib/seo';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import 'react-day-picker/style.css';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {default: SITE_TITLE, template: '%s | Prumo'},
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: 'finance',
  manifest: '/manifest.webmanifest',
  icons: {icon: [{url: '/logo.svg', type: 'image/svg+xml'}], apple: '/icon-192.png'},
  appleWebApp: {capable: true, title: SITE_NAME, statusBarStyle: 'default'},
  formatDetection: {telephone: false, address: false, email: false},
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    images: [{
      url: SOCIAL_IMAGE_URL,
      secureUrl: SOCIAL_IMAGE_URL,
      width: SOCIAL_IMAGE_WIDTH,
      height: SOCIAL_IMAGE_HEIGHT,
      alt: SOCIAL_IMAGE_ALT,
      type: 'image/png',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    images: [{url: SOCIAL_IMAGE_URL, alt: SOCIAL_IMAGE_ALT}],
  },
  robots: IS_PRODUCTION
    ? {index: true, follow: true, googleBot: {index: true, follow: true}}
    : {index: false, follow: false, googleBot: {index: false, follow: false}},
};
export const viewport: Viewport = {width:'device-width',initialScale:1,themeColor:'#030504'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{var r=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){r.classList.add('prumo-boot');if(location.pathname==='/'&&!location.hash)r.classList.add('prumo-intro');setTimeout(function(){r.classList.remove('prumo-boot','prumo-intro')},6500)}var t=localStorage.getItem('prumo:theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`}}/></head><body><LaunchProvider><ConfirmationProvider>{children}</ConfirmationProvider></LaunchProvider></body></html>}
