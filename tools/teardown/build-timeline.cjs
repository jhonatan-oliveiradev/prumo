const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const G=require('./assets/geometry.js'),P=require('./assets/projection.js');
const scope={TechnicalGeometry:G,TechnicalProjection:P};scope.self=scope;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'model.js'),'utf8'),scope);
const model=scope.PrumoLayerModel,parts=model.parts(),camera=P.createCamera(model.camera);
const fit=P.render(parts,{explosion:1,fitExplosion:0,fill:true,camera:model.camera,sample:.12});
const point=p=>camera.project(p).slice(0,2).map((n,i)=>Number((n*fit.scale+fit.offset[i]).toFixed(4)));
const projected=parts.map((part,index)=>{
 // Render each complete plate alone. Opaque painter order handles occlusion
 // between parallel non-intersecting plates at every continuous separation.
 const isolated=P.render([part],{explosion:0,fill:true,camera:model.camera,sample:.12});
 const scale=fit.scale/isolated.scale,shift=fit.offset.map((n,i)=>n-isolated.offset[i]*scale);
 const markup=`<g transform="translate(${shift.join(' ')}) scale(${scale})">${isolated.markup}</g>`;
 const lift=camera.project(part.explosion)[1]*fit.scale;
 const anchor=point([index%2===0?-56:56,index%2===0?-38:38,index*4.4+4]);
 return {id:part.id,name:part.name,markup,lift:Number(lift.toFixed(4)),anchor};
});
const centerLift=projected.at(-1).lift/2;
const assembled=projected.map(part=>`<g data-layer="${part.id}" transform="translate(0 ${centerLift})">${part.markup}</g>`).join('');
const exploded=projected.map(part=>`<g data-layer="${part.id}" transform="translate(0 ${part.lift})">${part.markup}</g>`).join('');
fs.writeFileSync(path.resolve(__dirname,'../../src/lib/generated/teardown.ts'),`// Generated from one shared Teardown model. Full plates; no quantized poses.\nexport const teardownCenterLift=${centerLift};\nexport const teardownParts=${JSON.stringify(projected)};\nexport const assembledLayers=${JSON.stringify(assembled)};\n`);
const target=path.resolve(__dirname,'../../public/illustrations');fs.mkdirSync(target,{recursive:true});
const style='[data-line-role]{fill:none;stroke:#91b59c;stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}[data-line-role=detail]{stroke-width:.55;opacity:.7}[data-fill]{fill:#0e1912}[data-fill=planning]{fill:#14251b}[data-fill=decisions]{fill:#1b3022}';
for(const [name,markup]of [['assembled',assembled],['exploded',exploded]])fs.writeFileSync(path.join(target,`prumo-layers-${name}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 0 320 297" width="960" height="891"><title>Camadas do Prumo — conceito ${name}</title><style>${style}</style><rect x="50" width="320" height="297" fill="#030504"/>${markup}</svg>`);
console.log(JSON.stringify({parts:projected.length,bytes:Buffer.byteLength(JSON.stringify(projected)),centerLift}));
