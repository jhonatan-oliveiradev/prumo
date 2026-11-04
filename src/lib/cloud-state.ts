import {emptyData} from './finance';
import type {WorkspaceSnapshot} from './sync';

/** An empty finance workspace must not erase the authenticated user's profile. */
export function hydrateWorkspace(workspace:WorkspaceSnapshot|null,userName:string){
 const source=workspace?.data??emptyData;
 return {data:{...source,name:source.name.trim()||userName.trim()},revision:workspace?.revision??0,dirty:false};
}
export const cloudStateForRevision=(revision:number)=>revision>0?'ready' as const:'connected' as const;
export function profileInitials(name:string){
 const words=name.trim().split(/\s+/).filter(Boolean);
 return words.length?`${words[0][0]}${words.length>1?words[words.length-1][0]:''}`.toLocaleUpperCase('pt-BR'):'P';
}
