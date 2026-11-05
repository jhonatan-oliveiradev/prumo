'use client';
import {useEffect,useState} from 'react';
import {Download,Check,Share,PlusSquare} from 'lucide-react';
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function InstallPrumo(){
 const [prompt,setPrompt]=useState<InstallEvent|null>(null),[installed,setInstalled]=useState(false),[help,setHelp]=useState(false);
 useEffect(()=>{setInstalled(window.matchMedia('(display-mode: standalone)').matches);const capture=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent);};const done=()=>{setInstalled(true);setPrompt(null);};window.addEventListener('beforeinstallprompt',capture);window.addEventListener('appinstalled',done);if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});return()=>{window.removeEventListener('beforeinstallprompt',capture);window.removeEventListener('appinstalled',done);};},[]);
 async function install(){if(!prompt){setHelp(v=>!v);return;}await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')setInstalled(true);setPrompt(null);}
 return <div className="install-prumo"><button className="primary" onClick={()=>void install()} aria-expanded={help}>{installed?<Check size={17}/>:<Download size={17}/>} {installed?'Instalado neste dispositivo':'Instalar Prumo'}</button>{help&&!installed&&<div className="install-help" role="status"><h3>Seu Prumo, a um toque.</h3><p><Share size={16}/> No iPhone ou iPad, abra no Safari, toque em Compartilhar e escolha <strong>Adicionar à Tela de Início</strong>.</p><p><PlusSquare size={16}/> No Android ou computador, abra o menu do navegador e procure <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</p><p>Se a opção não aparecer, você pode continuar usando pelo navegador.</p><a className="text-button" href="/app">Usar no navegador →</a></div>}</div>;
}
