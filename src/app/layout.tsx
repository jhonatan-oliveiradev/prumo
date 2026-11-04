import type { Metadata, Viewport } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './globals.css';
export const metadata: Metadata = {title:'Prumo — O seu dinheiro, no eixo.',description:'Clareza para registrar, entender e planejar seu dinheiro.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'Prumo',statusBarStyle:'default'},icons:{icon:'/logo.svg',apple:'/icon-192.png'}};
export const viewport: Viewport = {width:'device-width',initialScale:1,themeColor:'#274a37'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
