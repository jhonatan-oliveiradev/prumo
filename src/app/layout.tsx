import {LaunchProvider} from '@/components/launch-provider';
import {ConfirmationProvider} from '@/components/confirmation-provider';
import type { Metadata, Viewport } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import 'react-day-picker/style.css';
import './globals.css';
export const metadata: Metadata = {title:'Prumo — O seu dinheiro, no eixo.',description:'Clareza para registrar, entender e planejar seu dinheiro.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'Prumo',statusBarStyle:'default'},icons:{icon:'/logo.svg',apple:'/icon-192.png'}};
export const viewport: Viewport = {width:'device-width',initialScale:1,themeColor:'#030504'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{var r=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches){r.classList.add('prumo-boot');if(location.pathname==='/'&&!location.hash)r.classList.add('prumo-intro');setTimeout(function(){r.classList.remove('prumo-boot','prumo-intro')},6500)}var t=localStorage.getItem('prumo:theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`}}/></head><body><LaunchProvider><ConfirmationProvider>{children}</ConfirmationProvider></LaunchProvider></body></html>}
