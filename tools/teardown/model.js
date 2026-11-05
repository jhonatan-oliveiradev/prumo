(function(root){
 root.DrawingModels??={};
 const camera={azimuth:-132,elevation:29,roll:0};
 const inventory=[['records','Seus registros'],['commitments','Sua organização'],['planning','Seu planejamento'],['decisions','Suas escolhas']];
 function parts(){
  const G=root.TechnicalGeometry;
  return inventory.map(([id,name],index)=>{
   const p=G.part(id,name,[0,0,index*48]),z=index*4.4,h=index===3?5:4,top=z+h+.04;
   G.box(p,[-56,-38,z],[56,38,z+h],{radius:1.4});
   const line=(x,y,a,b)=>G.line(p,[x,y,top],[a,b,top],'detail');
   const rect=(x,y,w,h)=>G.polyline(p,[[x,y,top],[x+w,y,top],[x+w,y+h,top],[x,y+h,top]],{closed:true,role:'detail'});
   const circle=(x,y,r)=>G.circle(p,[x,y,top],r,[0,0,1],{segments:64,role:'detail'});
   // Interface layers, not an invented banking/backend architecture.
   if(index===0){
    rect(-48,-30,22,59);line(-23,-31,-23,31);
    for(let n=0;n<6;n++){circle(-43,-22+n*8,1);line(-39,-22+n*8,-30,-22+n*8);}
    for(let n=0;n<6;n++){const y=-24+n*9;rect(-15,y,5,4);line(-6,y+2,25,y+2);line(35,y+2,47,y+2);}
   }else if(index===1){
    rect(-47,-29,92,9);line(-47,-13,45,-13);
    for(let n=0;n<7;n++)line(-42+n*13,-8,-42+n*13,29);
    for(let n=0;n<4;n++)line(-47,-4+n*11,45,-4+n*11);
    [[-39,1],[-13,12],[13,1],[26,23]].forEach(([x,y])=>rect(x,y,7,4));
    for(let n=0;n<3;n++)rect(22+n*7,-27,4,4);
   }else if(index===2){
    rect(-47,-29,42,23);rect(3,-29,42,23);
    circle(24,-17,7);circle(24,-17,3);
    line(-42,-13,-35,-21);line(-35,-21,-26,-15);line(-26,-15,-18,-23);line(-18,-23,-10,-25);
    rect(-47,1,92,29);
    for(let n=0;n<10;n++)rect(-41+n*8,25-((n*7)%19),4,((n*7)%19)+1);
    line(-42,27,40,27);
   }else{
    rect(-48,-30,20,59);line(-25,-32,-25,32);
    for(let n=0;n<6;n++){circle(-43,-22+n*8,1);line(-39,-22+n*8,-32,-22+n*8);}
    rect(-18,-29,62,10);
    for(let n=0;n<3;n++)rect(-18+n*22,-12,18,11);
    rect(-18,6,40,24);rect(28,6,17,24);
    const points=[[-14,22],[-8,18],[-1,20],[5,13],[12,16],[18,10]];G.polyline(p,points.map(([x,y])=>[x,y,top]),{role:'detail'});
    for(let n=0;n<4;n++)line(32,11+n*5,41,11+n*5);
    // Sidewall divisions follow the plate's real front face.
    for(let n=0;n<18;n++)G.line(p,[-50+n*6,-38,z+.2],[-50+n*6,-38,z+h-.2],'detail');
   }
   return p;
  });
 }
 root.PrumoLayerModel={parts,camera,inventory};
 root.DrawingModels['prumo-layers']=(_parameters,options)=>root.TechnicalProjection.render(parts(),{...options,camera,sample:.12});
})(typeof self==='undefined'?globalThis:self);
