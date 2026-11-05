/** Bounded retries for explicit transient upstream failures. Never retry auth or quota failures. */
export async function geminiRequest(url:string,init:RequestInit,fetcher:typeof fetch=fetch,wait:(ms:number)=>Promise<void>=ms=>new Promise(resolve=>setTimeout(resolve,ms))){
 const signal=AbortSignal.timeout(28000);
 for(let attempt=0;;attempt++){
  signal.throwIfAborted();
  const response=await fetcher(url,{...init,signal});
  if(![500,502,503,504].includes(response.status)||attempt===2)return response;
  await response.body?.cancel();
  await wait(1000*2**attempt+Math.floor(Math.random()*250));
 }
}
