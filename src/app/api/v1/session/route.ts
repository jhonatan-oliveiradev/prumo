import {getAuth,cloudEnabled} from '@/lib/server/auth';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!cloudEnabled())return Response.json({enabled:false,user:null},{headers:{'Cache-Control':'no-store'}});
 try{
  const session=await getAuth().api.getSession({headers:request.headers});
  return Response.json({enabled:true,user:session?{id:session.user.id,name:session.user.name,email:session.user.email}:null},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'Não foi possível verificar a sessão.'},{status:503});}
}
