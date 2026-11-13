import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

export {THREE};
export const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export const lerp=(a,b,t)=>a+(b-a)*t;
export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export const norm=(v,a,b)=>clamp((v-a)/(b-a),0,1);
export function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- procedural textures ---------- */
const texCache={};
function baseTex(key,w,h,draw,srgb=true){
  if(!texCache[key]){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;texCache[key]=t}
  return texCache[key]}
export function tex(key,rx=1,ry=1){const t=TEX[key]().clone();t.repeat.set(rx,ry);t.needsUpdate=true;return t}
const speckle=(key,base,cols,n,smin,smax,seed=7)=>()=>baseTex(key,512,512,(g,s)=>{g.fillStyle=base;g.fillRect(0,0,s,s);const r=rng(seed);for(let i=0;i<n;i++){g.fillStyle=cols[Math.floor(r()*cols.length)];g.globalAlpha=.12+r()*.3;const q=smin+r()*(smax-smin);g.beginPath();g.ellipse(r()*s,r()*s,q,q*(.5+r()*.6),r()*3,0,7);g.fill()}g.globalAlpha=1});
const TEX={
  grass:speckle('grass','#77854f',['#5f7040','#8c955f','#6a7a48','#9a9a6c','#566838'],5200,1,5,11),
  gravel:speckle('gravel','#9c968a',['#7a756c','#b5afa3','#888277','#aaa397','#69655d'],6000,1,3.5,5),
  sand:speckle('sand','#c2ae84',['#b09c72','#d1c09a','#a8946c'],4200,1,4,3),
  soil:speckle('soil','#8a6f52',['#6f573f','#a08465','#7b6248','#5f4a36'],5200,1,6,9),
  rock:speckle('rock','#8f8b84',['#6f6c66','#a7a39b','#7d7a73','#b8b3a8','#5f5c57'],5200,2,9,13),
  concrete:speckle('concrete','#c9c8c3',['#b3b2ad','#d9d8d3','#a9a8a3'],3600,1,5,21),
  asphalt:speckle('asphalt','#5a5d61',['#4b4e52','#6a6d71','#3f4246'],4200,1,3,17),
  pv:()=>baseTex('pv',256,512,(g,w,h)=>{g.fillStyle='#b9c1cb';g.fillRect(0,0,w,h);const nx=6,ny=12,cw=w/nx,ch=h/ny;for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const gr=g.createLinearGradient(i*cw,j*ch,(i+1)*cw,(j+1)*ch);gr.addColorStop(0,'#10244a');gr.addColorStop(1,'#0a1832');g.fillStyle=gr;g.fillRect(i*cw+1.2,j*ch+1.2,cw-2.4,ch-2.4);g.fillStyle='rgba(190,205,225,.5)';for(let k=1;k<5;k++)g.fillRect(i*cw+k*cw/5,j*ch+1.2,.7,ch-2.4)}}),
  container:()=>baseTex('container',256,256,(g,w,h)=>{g.fillStyle='#eef0f1';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){const gr=g.createLinearGradient(x,0,x+16,0);gr.addColorStop(0,'rgba(0,0,0,.16)');gr.addColorStop(.35,'rgba(255,255,255,.2)');gr.addColorStop(.7,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.14)');g.fillStyle=gr;g.fillRect(x,0,16,h)}}),
  windows:()=>baseTex('windows',256,256,(g,w,h)=>{g.fillStyle='#d8d5cd';g.fillRect(0,0,w,h);const r=rng(4);for(let i=0;i<4;i++)for(let j=0;j<4;j++){const gr=g.createLinearGradient(0,j*64,0,j*64+64);gr.addColorStop(0,'#5e7f9c');gr.addColorStop(1,'#2e455c');g.fillStyle=gr;g.fillRect(i*64+9,j*64+14,46,34);g.fillStyle='rgba(255,255,255,'+(.05+r()*.18)+')';g.fillRect(i*64+9,j*64+14,46,34);g.fillStyle='#c4c1b9';g.fillRect(i*64+31,j*64+14,2,34)}}),
  strata:()=>baseTex('strata',512,512,(g,w,h)=>{const bands=['#a58a66','#8f7354','#b29b78','#7c6a58','#96806a','#6f6258','#857364','#5f5650','#7a5a4a','#6a4a40'];const r=rng(31);let y=0;bands.forEach((c,i)=>{const bh=h/bands.length;g.fillStyle=c;g.beginPath();g.moveTo(0,y);for(let x=0;x<=w;x+=16)g.lineTo(x,y+Math.sin(x*.02+i)*6+Math.sin(x*.05+i*2)*3);g.lineTo(w,h);g.lineTo(0,h);g.fill();for(let k=0;k<260;k++){g.fillStyle=r()>.5?'rgba(0,0,0,.12)':'rgba(255,255,255,.1)';g.fillRect(r()*w,y+r()*bh,2+r()*7,1+r()*2)}y+=bh})}),
  flow:()=>baseTex('flow',64,8,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#000');gr.addColorStop(.5,'#fff');gr.addColorStop(.62,'#000');g.fillStyle=gr;g.fillRect(0,0,w,h)}),
  waterN:()=>baseTex('waterN',256,256,(g,w,h)=>{const r=rng(99),waves=[];for(let i=0;i<14;i++)waves.push([Math.round((r()*2-1)*5),Math.round((r()*2-1)*5),r()*6.28,.4+r()]);const H=(x,y)=>{let s=0;for(const q of waves)s+=q[3]*Math.sin(6.2832*(q[0]*x+q[1]*y)/w+q[2]);return s};const im=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(H(x+1,y)-H(x-1,y))*.9,dy=(H(x,y+1)-H(x,y-1))*.9,l=Math.hypot(dx,dy,1),i=(y*w+x)*4;im.data[i]=(-dx/l*.5+.5)*255;im.data[i+1]=(-dy/l*.5+.5)*255;im.data[i+2]=(1/l*.5+.5)*255;im.data[i+3]=255}g.putImageData(im,0,0)},false)
};

/* ---------- materials & mesh helpers ---------- */
export const std=(color,rough=.6,metal=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,...extra});
export const mats=()=>({
  steel:std(0xbfc6cc,.38,.85),galv:std(0x9aa3ab,.5,.8),white:std(0xf3f4f4,.45,.05),dark:std(0x30353b,.6,.3),
  concrete:std(0xffffff,.92,0,{map:tex('concrete',2,2)}),hot:std(0xb5551a,.45,.3),cold:std(0x245caa,.45,.3),
  green:std(0x4a6b57,.6,.2),grey:std(0x7c858e,.6,.3),glass:new THREE.MeshPhysicalMaterial({color:0xcfe3ee,roughness:.05,metalness:0,transmission:.9,transparent:true,opacity:.35,thickness:.2}),
  mirror:std(0xe8eef2,.06,1),copper:std(0xb87333,.35,.9),yellow:std(0xe0b21c,.55,.2),red:std(0xa83a2a,.6,.2)
});
export function add(parent,geo,mat,x=0,y=0,z=0,shadow=true){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m}
export const box=(p,w,h,d,mat,x,y,z)=>add(p,new THREE.BoxGeometry(w,h,d),mat,x,y,z);
export const cyl=(p,rt,rb,h,mat,x,y,z,seg=28)=>add(p,new THREE.CylinderGeometry(rt,rb,h,seg),mat,x,y,z);
export const sph=(p,r,mat,x,y,z)=>add(p,new THREE.SphereGeometry(r,28,18),mat,x,y,z);
export function pipe(p,pts,r,mat,smoothPath=false){const v=pts.map(q=>q.isVector3?q:V(...q));let curve;if(smoothPath)curve=new THREE.CatmullRomCurve3(v,false,'catmullrom',.3);else{curve=new THREE.CurvePath();for(let i=0;i<v.length-1;i++)curve.add(new THREE.LineCurve3(v[i],v[i+1]))}
  const m=add(p,new THREE.TubeGeometry(curve,Math.max(24,v.length*14),r,14,false),mat);if(!smoothPath)for(let i=1;i<v.length-1;i++)sph(p,r*1.12,mat,v[i].x,v[i].y,v[i].z);return m}
export function flowMat(color,emissive,rep=8){const t=tex('flow',rep,1);return new THREE.MeshStandardMaterial({color,roughness:.4,metalness:.4,emissive,emissiveMap:t,emissiveIntensity:1.6})}
export function waterMat(color=0x2e6f8e,opacity=.86,rep=6){const n=tex('waterN',rep,rep);n.colorSpace=THREE.NoColorSpace;return new THREE.MeshPhysicalMaterial({color,roughness:.12,metalness:.1,transparent:true,opacity,normalMap:n,normalScale:new THREE.Vector2(.4,.4),envMapIntensity:1.3})}
export function ground(p,kind='grass',size=600,rep=90,y=0){const m=add(p,new THREE.CircleGeometry(size,64),std(0xffffff,1,0,{map:tex(kind,rep,rep)}),0,y,0,false);m.rotation.x=-Math.PI/2;return m}
export function pad(p,w,d,x,z,kind='concrete',h=.12,y=0){return box(p,w,h,d,std(0xd9d8d2,.95,0,{map:tex(kind,w/4,d/4)}),x,y+h/2,z)}

/* wind-turbine blade: lofted aerofoil sections, radial +Y, rotor axis X */
export function bladeGeo(L){const N=18,K=18,pos=[],idx=[];
  for(let i=0;i<=N;i++){const s=i/N,r=s*L,root=1-smooth(.02,.2,s),chord=L*lerp(lerp(.105,.024,smooth(.2,1,s)),.05,root),th=lerp(.2-.06*s,1,root),tw=lerp(.33*(1-s)*(1-s),0,0)+.02;
    for(let k=0;k<K;k++){const a=2*Math.PI*k/K,cz=chord*(Math.cos(a)*.5-.2*(1-root)),cx=chord*th*.5*Math.sin(a)*(1-.35*Math.cos(a)*(1-root));pos.push(cx*Math.cos(tw)-cz*Math.sin(tw),r,cx*Math.sin(tw)+cz*Math.cos(tw))}}
  for(let i=0;i<N;i++)for(let k=0;k<K;k++){const a=i*K+k,b=i*K+(k+1)%K,c=a+K,d=b+K;idx.push(a,c,b,b,c,d)}
  const tip=pos.length/3;pos.push(0,L*1.004,0);for(let k=0;k<K;k++)idx.push(N*K+k,tip,N*K+(k+1)%K);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g}
export function turbine(p,M,{H=24,R=9,x=0,z=0,yaw=0}={}){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;p.add(g);
  cyl(g,.75,1.25,H,M.white,0,H/2,0,32);cyl(g,1.5,1.6,.3,M.concrete,0,.15,0,24);
  const nac=add(g,new THREE.CapsuleGeometry(.95,3.2,8,20),M.white,.9,H+.55,0);nac.rotation.z=Math.PI/2;
  const rotor=new THREE.Group();rotor.position.set(-1.75,H+.55,0);g.add(rotor);
  const hub=add(rotor,new THREE.SphereGeometry(.85,24,16),M.white);hub.scale.set(1.5,1,1);
  const blades=new THREE.Group();rotor.add(blades);const bg=bladeGeo(1);
  for(let i=0;i<3;i++){const b=add(blades,bg,M.white);b.rotation.x=i*2*Math.PI/3;b.position.x=-.15}
  const setR=r=>{blades.children.forEach(b=>b.scale.setScalar(r))};setR(R);
  return {group:g,rotor,setR,H}}
export function container(p,M,x,z,{L=6.06,W=2.44,H=2.6,rot=0}={}){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;p.add(g);
  const m=std(0xffffff,.55,.25,{map:tex('container',L/1.2,1)});box(g,L,H,W,m,0,H/2+.15,0);box(g,L+.06,.12,W+.06,M.grey,0,.2,0);box(g,L+.06,.1,W+.06,M.grey,0,H+.18,0);
  box(g,.9,1.1,.5,M.grey,L/2-.9,H+.75,0);const fan=cyl(g,.36,.36,.06,M.dark,L/2-.9,H+1.32,0,20);
  box(g,.04,H-.5,.9,M.grey,-L/2-.02,H/2+.15,-.5);box(g,.04,H-.5,.9,M.grey,-L/2-.02,H/2+.15,.5);return g}
export function transformer(p,M,x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);box(g,1.8,1.6,1.3,M.green,0,.95,0);for(let i=-3;i<=3;i++)box(g,.06,1.2,.5,M.green,i*.25,.95,.9);for(let i=-1;i<=1;i++){cyl(g,.07,.1,.7,std(0x8a5a3a,.4,.1),i*.5,2.05,0,12)}box(g,2.2,.15,1.9,M.concrete,0,.08,0);return g}
export function pvTable(nx,ny,mw=1.1,mh=2){/* returns geometry params for instancing */return {nx,ny,mw,mh}}

/* ---------- renderer / viewer ---------- */
let supported=null;
export function isSupported(){if(supported===null){try{const c=document.createElement('canvas');supported=!!(c.getContext('webgl2')||c.getContext('webgl'))}catch(e){supported=false}}return supported}
function makeRenderer(preserve=false){const r=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:preserve,powerPreference:'high-performance'});r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFShadowMap;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=.96;return r}
function skyDome(){const g=new THREE.SphereGeometry(900,32,16),m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new THREE.Color(0x4f86c6)},hor:{value:new THREE.Color(0xdfe9f1)},k:{value:1}},vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 hor;uniform float k;varying vec3 p;void main(){float h=clamp(p.y,0.,1.);vec3 c=mix(hor,top,pow(h,.55));c=mix(hor*.96,c,smoothstep(-.02,.03,p.y));gl_FragColor=vec4(c*k,1.);}'});return new THREE.Mesh(g,m)}
function buildWorld(renderer,builder,vals){
  const scene=new THREE.Scene();const pm=new THREE.PMREMGenerator(renderer);const envRT=pm.fromScene(new RoomEnvironment(),.04);scene.environment=envRT.texture;scene.environmentIntensity=.42;pm.dispose();
  scene.fog=new THREE.Fog(0xdfe9f1,140,620);const sky=skyDome();scene.add(sky);
  const hemi=new THREE.HemisphereLight(0xbcd4ee,0x6f6a55,.62);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff1dc,3.5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;scene.add(sun);scene.add(sun.target);
  const root=new THREE.Group();scene.add(root);const M=mats();
  const spec=builder({root,M,sun,hemi,sky,scene},vals)||{};
  const S=spec.size||40,dir=(spec.sunDir||V(.55,.8,.45)).clone().normalize();sun.position.copy(dir.multiplyScalar(S*3));const sc=sun.shadow.camera;sc.left=sc.bottom=-S*1.3;sc.right=sc.top=S*1.3;sc.near=1;sc.far=S*7;sc.updateProjectionMatrix();
  scene.fog.near=S*3.2;scene.fog.far=Math.max(520,S*11);
  const camera=new THREE.PerspectiveCamera(spec.fov||34,1.6,.5,2500);camera.position.copy(spec.cam||V(S,S*.6,S));
  return {scene,camera,spec,envRT,root,target:spec.target||V(0,S*.15,0)}}
function disposeWorld(w){w.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{for(const k in m){const v=m[k];if(v&&v.isTexture)v.dispose()}m.dispose()})}});w.envRT.dispose()}

let live=null,liveRenderer=null;
export function unmount(){if(live){cancelAnimationFrame(live.raf);live.ro.disconnect();if(live.io)live.io.disconnect();live.controls.dispose();disposeWorld(live.world);if(liveRenderer.domElement.parentNode)liveRenderer.domElement.parentNode.removeChild(liveRenderer.domElement);live=null}}
export function mount(host,builder,vals,opts={}){
  if(!isSupported())return null;unmount();
  try{if(!liveRenderer){liveRenderer=makeRenderer();liveRenderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault()})}}catch(e){supported=false;return null}
  const renderer=liveRenderer,canvas=renderer.domElement,world=buildWorld(renderer,builder,vals),{scene,camera,spec}=world;
  canvas.className='re3d-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',opts.label||'Interactive 3D model');host.prepend(canvas);
  const controls=new OrbitControls(camera,canvas);controls.target.copy(world.target);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.enableZoom=false;controls.maxPolarAngle=spec.maxPolar||Math.PI*.488;controls.minPolarAngle=.15;if(spec.cutaway){controls.minAzimuthAngle=-1.05;controls.maxAzimuthAngle=1.05}
  const d0=camera.position.distanceTo(world.target);controls.minDistance=d0*.35;controls.maxDistance=d0*1.9;const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.autoRotate=!reduce&&opts.autoRotate!==false;controls.autoRotateSpeed=opts.rotateSpeed||.55;controls.addEventListener('start',()=>{controls.autoRotate=false;if(opts.onInteract)opts.onInteract()});controls.update();
  const home={p:camera.position.clone(),t:world.target.clone()};
  const labelEls=[];const layer=opts.labelLayer;if(layer&&spec.labels){layer.innerHTML='';spec.labels.forEach((l,i)=>{const b=document.createElement('button');b.type='button';b.className='re3d-dot';b.textContent=i+1;b.title=l.name;b.setAttribute('aria-label',l.name);b.onclick=()=>opts.onSelect&&opts.onSelect(i);layer.appendChild(b);labelEls.push(b)})}
  const st={raf:0,world,controls,playing:!reduce,labels:true,t:0,ro:null,w:0,h:0};
  const size=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h||(w===st.w&&h===st.h))return;st.w=w;st.h=h;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};
  st.ro=new ResizeObserver(size);st.ro.observe(host);size();
  const v=new THREE.Vector3();let last=performance.now();let stT=0,vis=true,oi=0;const rc=new THREE.Raycaster(),hid=[],cd=new THREE.Vector3();const io=new IntersectionObserver(e=>{vis=e[e.length-1].isIntersecting});io.observe(host);st.io=io;
  const frame=now=>{if(live!==st)return;if(!canvas.isConnected){unmount();return}st.raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden||!vis)return;
    if(st.playing){st.t+=dt;if(spec.update)spec.update(dt,st.t)}controls.update();renderer.render(scene,camera);if(now-stT>250&&opts.onStatus&&spec.status){stT=now;opts.onStatus(spec.status())}
    if(labelEls.length){const L=spec.labels;oi=(oi+1)%L.length;cd.copy(L[oi].pos).sub(camera.position);const dist=cd.length();rc.set(camera.position,cd.normalize());rc.far=dist-1.2;hid[oi]=rc.intersectObject(world.root,true).some(h=>{const m=Array.isArray(h.object.material)?h.object.material[0]:h.object.material;return !m.transparent&&!h.object.isInstancedMesh});labelEls.forEach((b,i)=>{v.copy(spec.labels[i].pos).project(camera);const ok=st.labels&&v.z<1&&Math.abs(v.x)<.97&&Math.abs(v.y)<.95;b.style.display=ok?'':'none';b.style.opacity=hid[i]?.38:1;if(ok)b.style.transform=`translate(-50%,-50%) translate(${((v.x+1)/2*st.w).toFixed(1)}px,${((1-v.y)/2*st.h).toFixed(1)}px)`})}};
  live=st;if(spec.update)spec.update(0,0);st.raf=requestAnimationFrame(frame);
  return {labels:spec.labels||[],set:vals=>spec.set&&spec.set(vals),zoom:f=>{const d=camera.position.clone().sub(controls.target);d.multiplyScalar(clamp(d.length()*f,controls.minDistance,controls.maxDistance)/d.length());camera.position.copy(controls.target).add(d)},reset:()=>{camera.position.copy(home.p);controls.target.copy(home.t)},
    rotate:on=>{controls.autoRotate=on},isRotating:()=>controls.autoRotate,play:on=>{st.playing=on},isPlaying:()=>st.playing,showLabels:on=>{st.labels=on},mark:i=>labelEls.forEach((b,j)=>b.classList.toggle('active',i===j))}}

/* static thumbnails rendered sequentially with one temporary renderer */
export async function thumbnails(list,w,h,onEach){if(!isSupported())return;let r;try{r=makeRenderer(true)}catch(e){return}r.setPixelRatio(1);r.setSize(w,h,false);
  for(const [id,builder,vals] of list){try{const world=buildWorld(r,builder,vals);world.camera.aspect=w/h;world.camera.updateProjectionMatrix();world.camera.lookAt(world.target);if(world.spec.update)world.spec.update(0,2.2);r.render(world.scene,world.camera);const url=r.domElement.toDataURL('image/jpeg',.86);disposeWorld(world);onEach(id,url)}catch(e){}await new Promise(res=>setTimeout(res,30))}
  r.dispose();r.forceContextLoss()}
