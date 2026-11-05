/** Original WebGL1 glyph-field shader. Uses only a locally drawn glyph atlas. */
const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment=`precision highp float;
uniform vec2 resolution;uniform vec2 pointer;uniform float time;uniform float pixelRatio;uniform sampler2D atlas;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
void main(){
 vec2 pixel=gl_FragCoord.xy/pixelRatio;vec2 size=resolution/pixelRatio;
 vec2 cellSize=vec2(11.,15.);vec2 cell=floor(pixel/cellSize);vec2 local=fract(pixel/cellSize);
 vec2 uv=pixel/size;vec2 flow=cell*.055+vec2(time*.07,-time*.04);
 float field=noise(flow+vec2(sin(uv.y*6.+time*.2)*.7,cos(uv.x*5.-time*.17)*.8));
 field+=.36*noise(flow*2.1-vec2(time*.06));
 float wave=.5+.5*sin(uv.x*12.+uv.y*8.+field*7.-time*.35);
 float nearPointer=exp(-length((uv-pointer)*vec2(size.x/size.y,1.))*4.);
 float density=smoothstep(.28,.94,field*.72+wave*.34+nearPointer*.15);
 float glyph=floor(mod(hash(cell+floor(time*.12))*13.+floor(density*7.),4.));
 vec2 atlasUV=vec2((glyph+local.x)/4.,1.-local.y);
 float ink=texture2D(atlas,atlasUV).a;
 float fade=smoothstep(0.,.14,uv.y)*smoothstep(0.,.14,1.-uv.y);
 float intensity=(.08+density*.65)*fade;
 vec3 background=vec3(.012,.020,.016);vec3 sage=vec3(.569,.710,.612);
 gl_FragColor=vec4(mix(background,sage,ink*intensity),1.);
}`;
export function createAlignmentRenderer(canvas:HTMLCanvasElement){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return null;
 const shaders:WebGLShader[]=[];let program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null,texture:WebGLTexture|null=null;
 function dispose(){if(texture)gl!.deleteTexture(texture);if(buffer)gl!.deleteBuffer(buffer);if(program)gl!.deleteProgram(program);shaders.forEach(shader=>gl!.deleteShader(shader));}
 try{
  function compile(kind:number,source:string){const shader=gl!.createShader(kind);if(!shader)throw Error('shader');shaders.push(shader);gl!.shaderSource(shader,source);gl!.compileShader(shader);if(!gl!.getShaderParameter(shader,gl!.COMPILE_STATUS))throw Error('compile');return shader;}
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();if(!program)throw Error('program');gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link');gl.useProgram(program);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const image=document.createElement('canvas');image.width=128;image.height=32;const context=image.getContext('2d');if(!context)throw Error('atlas');context.fillStyle='#fff';context.font='500 25px Inter, sans-serif';context.textAlign='center';context.textBaseline='middle';['R','$','/','+'].forEach((glyph,index)=>context.fillText(glyph,index*32+16,17));gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  const resolution=gl.getUniformLocation(program,'resolution'),pointer=gl.getUniformLocation(program,'pointer'),time=gl.getUniformLocation(program,'time'),pixelRatio=gl.getUniformLocation(program,'pixelRatio');gl.uniform1i(gl.getUniformLocation(program,'atlas'),0);
  return {draw(seconds:number,dpr:number,x:number,y:number){gl!.viewport(0,0,canvas.width,canvas.height);gl!.uniform2f(resolution,canvas.width,canvas.height);gl!.uniform2f(pointer,x,y);gl!.uniform1f(time,seconds);gl!.uniform1f(pixelRatio,dpr);gl!.drawArrays(gl!.TRIANGLES,0,6);},dispose};
 }catch{dispose();return null;}
}
