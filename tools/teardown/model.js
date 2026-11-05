(function(root){
 root.DrawingModels??={};
 root.DrawingModels['prumo-layers']=(_parameters,options)=>{
  const G=root.TechnicalGeometry;
  const parts=[['records','Seus registros'],['planning','Seu planejamento'],['decisions','Suas escolhas']].map(([id,name],index)=>{
   const p=G.part(id,name,[0,0,index*42]);const z=index*3.3;
   G.box(p,[-45,-32,z],[45,32,z+3],{radius:2});
   // Authored interface details on a shared top plane, no invented mechanical parts.
   if(index===0){
    for(let n=0;n<4;n++){G.line(p,[-32,-20+n*12,z+3.02],[12,-20+n*12,z+3.02],'detail');G.line(p,[20,-20+n*12,z+3.02],[31,-20+n*12,z+3.02],'detail');}
   }else if(index===1){
    for(let n=0;n<6;n++)G.polyline(p,[[-31+n*11,20,z+3.02],[-31+n*11,-3-n*3,z+3.02],[-25+n*11,-3-n*3,z+3.02],[-25+n*11,20,z+3.02]],{closed:true,role:'detail'});
   }else{
    for(const radius of [5,11,17])G.circle(p,[0,0,z+3.02],radius,[0,0,1],{segments:48,role:'detail'});
    G.line(p,[-28,0,z+3.02],[28,0,z+3.02],'detail');G.line(p,[0,-24,z+3.02],[0,24,z+3.02],'detail');
   }
   return p;
  });
  return root.TechnicalProjection.render(parts,{...options,camera:{azimuth:-125,elevation:24,roll:0},sample:.15});
 };
})(typeof self==='undefined'?globalThis:self);
