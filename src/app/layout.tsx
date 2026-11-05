import type { Metadata, Viewport } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import 'react-day-picker/style.css';
import './globals.css';
export const metadata: Metadata = {title:'Prumo — O seu dinheiro, no eixo.',description:'Clareza para registrar, entender e planejar seu dinheiro.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'Prumo',statusBarStyle:'default'},icons:{icon:'/logo.svg',apple:'/icon-192.png'}};
export const viewport: Viewport = {width:'device-width',initialScale:1,themeColor:'#030504'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`try{var t=localStorage.getItem('prumo:theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`}}/></head><body>{children}</body></html>}
