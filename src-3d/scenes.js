import {THREE,V,lerp,clamp,smooth,norm,rng,tex,std,add,box,cyl,sph,pipe,flowMat,waterMat,ground,pad,turbine,container,transformer} from './core.js';
const PI=Math.PI,DS=THREE.DoubleSide;
const flows=()=>{const list=[];return {add:(m,s=1)=>{list.push([m,s]);return m},step:(dt,k=1)=>list.forEach(([m,s])=>{m.emissiveMap.offset.x-=dt*s*k})}};

/* instanced tilted panel array (PV modules / flat-plate collectors) */
function panelArray(parent,M,{rows,cols,mw=1.1,mh=2,tilt=.4,pitch=5,hc=1.25,x0=0,z0=0,y0=0,face,gap=.03,posts=true,keepRack=false}){
  const g=new THREE.Group();g.position.set(x0,y0,z0);parent.add(g);const max=rows*cols,frame=std(0xc9ced3,.4,.8),back=std(0xe9ebec,.7,0);
  const pm=new THREE.InstancedMesh(new THREE.BoxGeometry(mw,.045,mh),[frame,frame,face,back,frame,frame],max);pm.castShadow=pm.receiveShadow=true;g.add(pm);
  const d=new THREE.Object3D(),W=cols*(mw+gap);let k=0;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){d.position.set(-W/2+(c+.5)*(mw+gap),hc,r*pitch);d.rotation.set(tilt,0,0);d.scale.set(1,1,1);d.updateMatrix();pm.setMatrixAt(k++,d.matrix)}
  let post=null,rail=null;
  if(posts){const dz=Math.cos(tilt)*mh*.32,dy=Math.sin(tilt)*mh*.32;post=new THREE.InstancedMesh(new THREE.CylinderGeometry(.045,.045,1,10),M.galv,max*2);rail=new THREE.InstancedMesh(new THREE.BoxGeometry(mw+gap,.07,.05),M.galv,max*2);post.castShadow=rail.castShadow=true;g.add(post,rail);k=0;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=-W/2+(c+.5)*(mw+gap);[[-dz,hc+dy],[dz,hc-dy]].forEach(([z,y])=>{d.rotation.set(0,0,0);d.position.set(x-mw/2,(y-.06)/2,r*pitch+z);d.scale.set(1,y-.06,1);d.updateMatrix();post.setMatrixAt(k,d.matrix);d.position.set(x,y-.07,r*pitch+z);d.scale.set(1,1,1);d.rotation.set(tilt,0,0);d.updateMatrix();rail.setMatrixAt(k++,d.matrix)})}}
  const setCount=n=>{n=clamp(Math.round(n),0,max);pm.count=n;if(post&&!keepRack){post.count=n*2;rail.count=n*2}};setCount(max);return {group:g,setCount,max}}
const pvFace=()=>std(0xffffff,.16,.25,{map:tex('pv',1,1),envMapIntensity:1.5});
function sunLook(ctx,G){const t=norm(G,100,1100);ctx.sun.intensity=lerp(.5,4,t);ctx.hemi.intensity=lerp(.45,.66,t);ctx.sky.material.uniforms.k.value=lerp(.7,1,t)}
function fence(p,M,x0,z0,x1,z1){const n=Math.round(Math.hypot(x1-x0,z1-z0)/3);for(let i=0;i<=n;i++)cyl(p,.04,.04,1.6,M.galv,lerp(x0,x1,i/n),.8,lerp(z0,z1,i/n),8);const m=box(p,Math.hypot(x1-x0,z1-z0),.03,.03,M.galv,(x0+x1)/2,1.55,(z0+z1)/2);m.rotation.y=-Math.atan2(z1-z0,x1-x0);const m2=m.clone();m2.position.y=.9;p.add(m2)}
function pylon(p,M,x,z,h=14,rot=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;p.add(g);const s=1.3;[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,b])=>{const m=cyl(g,.06,.09,h,M.galv,a*s*.5,h/2,b*s*.5,6);m.rotation.z=-a*.04;m.rotation.x=b*.04});for(let y=2;y<h;y+=2.4)box(g,s*(1-y/h*.5),.06,s*(1-y/h*.5),M.galv,0,y,0);[h-.6,h-2.6].forEach(y=>{box(g,.1,.1,5.4,M.galv,0,y,0);[-2.6,2.6].forEach(q=>cyl(g,.05,.05,.7,std(0x8a5a3a,.4),0,y-.4,q,8))});return g}
function wire(p,a,b,sag=1.2){const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(V(lerp(a[0],b[0],t),lerp(a[1],b[1],t)-Math.sin(t*PI)*sag,lerp(a[2],b[2],t)))}return add(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.025,5),std(0x3a3f45,.5,.6),0,0,0,false)}
function vessel(p,mat,r,L,x,y,z,vertical=false){const m=add(p,new THREE.CapsuleGeometry(r,L,10,24),mat,x,y,z);if(!vertical)m.rotation.z=PI/2;return m}
function building(p,M,w,h,d,x,z,{color=0xe4e2dc,roof=0x8d9499,door=true}={}){const g=new THREE.Group();g.position.set(x,0,z);p.add(g);box(g,w,h,d,std(color,.85),0,h/2,0);box(g,w+.4,.25,d+.4,std(roof,.7,.3),0,h+.12,0);if(door)box(g,1.2,2.1,.06,M.grey,-w/4,1.05,d/2+.02);return g}

/* ================= WIND ================= */
export function wind(ctx,vals=[8,10]){const {root,M}=ctx,F=flows();ground(root,'grass');
  const T=turbine(root,M,{H:24,R:9});
  pad(root,7,5,9,7);container(root,M,9,7,{L:4.2});const tr=transformer(root,M,4.2,4.4,.9);
  const mast=cyl(root,.06,.1,30,M.galv,-16,15,-12,6);for(let i=0;i<3;i++){const a=box(root,1.6,.04,.04,M.galv,-16,29-i*8,-12);a.rotation.y=.6;sph(root,.12,M.dark,-16.65,29-i*8+.12,-11.55)}
  const far=[[70,-60,.3],[120,-10,-.2],[55,-130,.1]].map(([x,z,y])=>turbine(root,M,{H:26,R:11,x,z,yaw:y}));
  const N=46,r=rng(5),streak=new THREE.InstancedMesh(new THREE.BoxGeometry(2.2,.03,.03),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.3,depthWrite:false}),N);root.add(streak);
  const P=[];for(let i=0;i<N;i++)P.push([-45+r()*90,6+r()*32,-20+r()*40,.7+r()*.6]);const d=new THREE.Object3D();
  let v=8,R=5,k=1;
  const set=([vv,D])=>{v=vv;R=D/2;k=lerp(.42,1,norm(D,2,30));T.group.scale.setScalar(k);T.setR(R/k)};set(vals);
  return {size:34,cam:V(-36,13,46),target:V(1,12.5,0),sunDir:V(-.45,.8,.5),set,
    update(dt){const w=Math.min(5.2,.24*7*v/Math.max(R,1));T.rotor.rotation.x+=w*dt;far.forEach((f,i)=>{f.rotor.rotation.x+=dt*(.5+.1*i)*v/8});
      for(let i=0;i<N;i++){const q=P[i];q[0]+=dt*v*1.5*q[3];if(q[0]>45)q[0]=-45;d.position.set(q[0],q[1],q[2]);d.scale.set(.5+v/9,1,1);d.updateMatrix();streak.setMatrixAt(i,d.matrix)}streak.instanceMatrix.needsUpdate=true},
    status:()=>`Rotor diameter ${2*R} m · tip-speed ratio 7 assumed · rotor ≈ ${(7*v/R*9.549).toFixed(0)} rev/min`,
    get labels(){const h=T.H*k;return [
      {pos:V(-1.75*k,h+R*.62,0),name:'Rotor blades',text:'Aerofoil blades generate lift; swept area A = πD²/4 sets the captured wind stream.'},
      {pos:V(-2.1*k,h+.55*k,0),name:'Hub and pitch system',text:'Connects blades to the main shaft; pitch drives rotate each blade to regulate power above rated speed.'},
      {pos:V(1.8*k,h+1.3*k,0),name:'Nacelle',text:'Houses the main shaft, gearbox (if fitted), generator and yaw drive that turns the rotor into the wind.'},
      {pos:V(0,h*.45,0),name:'Tower',text:'Raises the rotor into faster, less turbulent wind; wind speed increases with height (wind shear).'},
      {pos:V(4.2,2,4.4),name:'Transformer',text:'Steps generator voltage up for collection and export to the grid.'},
      {pos:V(-16,29,-12),name:'Met mast',text:'Anemometers and vanes at several heights measure the site wind resource and shear.'}]}}}

/* ================= SOLAR PV ================= */
export function pv(ctx,vals=[800,20]){const {root,M}=ctx;ground(root,'gravel',600,110);
  const arr=panelArray(root,M,{rows:5,cols:10,pitch:4.6,tilt:.41,x0:1.5,z0:-9,face:pvFace(),keepRack:true});
  pad(root,6,9,-9.5,-8);container(root,M,-9.5,-10,{L:3.6,H:2.4,rot:1.5708});transformer(root,M,-9.5,-5.4,.9);
  box(root,.5,.06,22,std(0x5f5a52,.9),-5.6,.03,1);for(let r=0;r<5;r++)box(root,.4,.7,.25,M.grey,-4.9,.75,-9+r*4.6-.9);
  fence(root,M,-13.5,-14,10,-14);fence(root,M,10,-14,10,14);fence(root,M,-13.5,-14,-13.5,14);
  pylon(root,M,-22,-12,13,.3);wire(root,[-9.5,2.6,-5.4],[-22,12.4,-12],1.5);
  let G=800,A=20;const set=([g,a])=>{G=g;A=a;arr.setCount(a/2);sunLook(ctx,g)};set(vals);
  return {size:22,cam:V(17,9.5,25),target:V(-1.5,.6,0),sunDir:V(.35,.82,.6),set,
    status:()=>`${Math.round(A/2)} modules of 2 m² shown · fixed tilt 23° · sunlight scaled to ${G} W/m²`,
    labels:[{pos:V(-2.8,1.6,-9),name:'PV modules',text:'Series-connected silicon cells under glass convert absorbed sunlight directly to DC electricity.'},
      {pos:V(6.4,.6,4.4),name:'Mounting structure',text:'Fixed-tilt racking faces the equator; a tilt near the site latitude (about 23° for Dhaka) favours annual yield.'},
      {pos:V(-4.9,1.2,-.7),name:'String combiner boxes',text:'Collect module strings in parallel, with fuses and surge protection, before the inverter.'},
      {pos:V(-9.5,2.9,-10),name:'Inverter station',text:'Converts DC to grid-synchronised AC and tracks the array maximum power point (MPPT).'},
      {pos:V(-9.5,2,-5.4),name:'Transformer',text:'Raises inverter AC voltage for the distribution network.'}]}}

/* ================= SOLAR THERMAL & CSP ================= */
export function thermal(ctx,vals=[700,10]){const {root,M}=ctx,F=flows();ground(root,'sand',600,90);
  const sunDir=V(.5,.8,.25);
  /* foreground: flat-plate collectors on a service-building roof (matches the calculator) */
  const b=building(root,M,24,4.2,12,-12,30);const face=std(0x10151c,.12,.5,{envMapIntensity:1.6});
  const fp=panelArray(b,M,{rows:4,cols:10,mw:1,mh:2,tilt:.41,pitch:2.9,hc:.75,x0:-4.5,z0:-4.2,y0:4.3,face,gap:.12,keepRack:true});
  const tank=vessel(b,M.white,1.15,2.6,8.6,6.4,-1.5,true);cyl(b,.1,.1,2,M.galv,8.6,5.2,-1.5);
  const hp=F.add(flowMat(0xb5551a,0xff7a1a,10));pipe(b,[[-10.2,4.5,5.3],[7,4.5,5.3],[7,5.4,-1.5],[7.5,5.4,-1.5]],.09,hp);pipe(b,[[7.5,4.6,-2.2],[6.4,4.6,-2.2],[6.4,4.45,-5.4],[-10.2,4.45,-5.4]],.09,M.cold);
  /* parabolic-trough loop */
  const f=1.7,ap=5.6,Lm=12,rows=4,mods=4,tr=new THREE.Group();root.add(tr);const pg=new THREE.PlaneGeometry(ap,Lm-.3,18,1);const p=pg.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,x*x/(4*f))}pg.computeVertexNormals();
  const mir=std(0xf2f6f8,.05,1,{side:DS,envMapIntensity:1.8}),glow=new THREE.MeshStandardMaterial({color:0x2a2a2a,emissive:0xff6a1a,emissiveIntensity:1,roughness:.4}),ang=Math.atan2(sunDir.x,sunDir.y);
  for(let r=0;r<rows;r++){const x=8+r*10.5;for(let m=0;m<mods;m++){const z=-34+m*Lm;const g=new THREE.Group();g.position.set(x,3.2,z+Lm/2);g.rotation.z=-ang;tr.add(g);const s=add(g,pg,mir,0,-f*.25,0);s.rotation.x=-PI/2;
      const rc=cyl(g,.075,.075,Lm,glow,0,f*.75,0,12);rc.rotation.x=PI/2;rc.castShadow=false;[-1,1].forEach(q=>{const a=box(g,.05,f*1.15,.05,M.galv,q*.3,f*.25,Lm/2-.4);a.rotation.z=q*.22;const c=a.clone();c.position.z=-Lm/2+.4;g.add(c)});const tt=cyl(g,.16,.16,Lm,M.galv,0,-f*.3,0,10);tt.rotation.x=PI/2}
    for(let m=0;m<=mods;m++){const z=-34+m*Lm;const py=add(root,new THREE.CylinderGeometry(.12,.3,3.2,4),M.galv,x,1.6,z);py.scale.z=.5}}
  const hot=F.add(flowMat(0xb5551a,0xff7a1a,26)),coldm=F.add(flowMat(0x245caa,0x5aa0ff,26));
  pipe(root,[[8,.6,14.6],[41,.6,14.6],[41,.6,24],[35,.6,24]],.22,hot);pipe(root,[[8,.5,-35],[45,.5,-35],[45,.5,30],[35,.5,30]],.22,coldm);
  for(let r=0;r<rows;r++){const x=8+r*10.5;pipe(root,[[x,.6,14.6],[x,3.2+f*.75*Math.cos(ang),14]],.1,M.hot);pipe(root,[[x,.5,-35],[x,3.2+f*.75*Math.cos(ang),-34.2]],.1,M.cold)}
  /* power block */
  pad(root,26,16,24,27);const th=cyl(root,3,3,6,std(0xd9a45a,.5,.3),15,3.1,24,36),tc=cyl(root,3,3,6,std(0x9fb4c9,.5,.3),15,3.1,31,36);
  [th,tc].forEach(t=>{const c=add(root,new THREE.ConeGeometry(3.05,.7,36),M.steel,t.position.x,6.45,t.position.z)});
  vessel(root,M.steel,.9,5,25,2.2,24);box(root,.3,1.2,1.4,M.galv,23,.6,24);box(root,.3,1.2,1.4,M.galv,27,.6,24);
  building(root,M,9,5.5,7,27,31.5,{color:0xdfe3e6});
  const acc=new THREE.Group();acc.position.set(36,0,22);root.add(acc);box(acc,7,1.4,9,M.steel,0,6.3,0);for(let i=0;i<2;i++)for(let j=0;j<2;j++)cyl(acc,.12,.12,5.6,M.galv,-3.2+i*6.4,2.8,-4.2+j*8.4,8);
  const fans=[];for(let j=0;j<3;j++){cyl(acc,1.35,1.35,.5,M.grey,0,7.2,-3+j*3,24);const fn=new THREE.Group();fn.position.set(0,7.5,-3+j*3);acc.add(fn);for(let q=0;q<5;q++){const bl=box(fn,1.2,.03,.34,M.white,.62,0,0);bl.position.set(Math.cos(q*1.2566)*.62,0,Math.sin(q*1.2566)*.62);bl.rotation.y=-q*1.2566}fans.push(fn)}
  pipe(root,[[29.5,4.5,29],[33,5.6,24],[33,6.3,22]],.3,M.steel,true);
  let G=700,A=10;const set=([g,a])=>{G=g;A=a;fp.setCount(a/2);sunLook(ctx,g);const t=norm(g,100,1000);glow.emissiveIntensity=lerp(.15,2.6,t);hp.emissiveIntensity=hot.emissiveIntensity=lerp(.3,1.8,t)};set(vals);
  return {size:50,cam:V(-46,27,66),target:V(10,2,12),sunDir,set,update(dt){F.step(dt,.25+G/900);fans.forEach(fn=>fn.rotation.y+=dt*7)},
    status:()=>`${Math.round(A/2)} flat-plate collectors of 2 m² on the roof (calculator model) · trough field shown for comparison`,
    labels:[{pos:V(-21,5.6,25.8),name:'Flat-plate collectors',text:'Glazed absorber plates heat water using direct and diffuse sunlight; this is the system the adjustable model calculates.'},
      {pos:V(-3.4,8.6,28.5),name:'Hot-water storage tank',text:'Insulated tank stores collected heat; Q = m cp ΔT.'},
      {pos:V(8,5.6,-10),name:'Parabolic-trough mirrors',text:'Single-axis tracking mirrors focus direct-beam (DNI) sunlight onto a line; diffuse light cannot be focused.'},
      {pos:V(18.5,5.2,2),name:'Receiver tubes',text:'Selective-coated steel tubes in evacuated glass carry heat-transfer fluid along the focal line.'},
      {pos:V(41,1.2,19),name:'Hot and cold headers',text:'Cold fluid is distributed to the loops; heated fluid returns to storage and the steam generator.'},
      {pos:V(15,7.4,27.5),name:'Thermal storage tanks',text:'Hot and cold molten-salt tanks shift generation into the evening; storage does not add energy.'},
      {pos:V(26,6.4,30),name:'Power block',text:'Steam generator and Rankine-cycle turbine convert heat to electricity, bounded by the Carnot limit.'},
      {pos:V(36,8.2,22),name:'Air-cooled condenser',text:'Rejects low-temperature heat from turbine exhaust steam to ambient air.'}]}}

/* ================= HYDRO ================= */
export function hydro(ctx,vals=[20,1]){const {root,M}=ctx,F=flows();ground(root,'grass',700,100,-.6);
  const ridge=(d,a,b,c,e)=>smooth(a,b,d)*(1-smooth(c,e,d));
  const hf=(x,z)=>{const az=Math.abs(z);let fl=x<-1?3:x<5?lerp(3,0,(x+1)/6):0;if(x>6)fl-=smooth(5.2,2.6,az)*1.3;const n=Math.sin(x*.21+z*.13)*1.2+Math.sin(x*.47-z*.31)*.6+Math.sin(z*.8+x*.9)*.25;
    const w=Math.max(ridge(az,8,26,34,52)*(z>0?lerp(.62,.36,smooth(0,40,x)):1),ridge(-x,40,52,58,66)*(1-smooth(40,52,az)));return fl+w*(19+n*.9)-.02};
  const tg=new THREE.PlaneGeometry(136,108,170,135);tg.rotateX(-PI/2);const tp=tg.attributes.position,col=[];for(let i=0;i<tp.count;i++)tp.setY(i,hf(tp.getX(i),tp.getZ(i)));tg.computeVertexNormals();const tn=tg.attributes.normal,c1=new THREE.Color(0x8fa565),c2=new THREE.Color(0xb3aa9a),cc=new THREE.Color();
  for(let i=0;i<tp.count;i++){const s=smooth(.9,.6,tn.getY(i));cc.copy(c1).lerp(c2,s*.85);col.push(cc.r,cc.g,cc.b)}tg.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  add(root,tg,std(0xffffff,1,0,{map:tex('rock',9,7),vertexColors:true}));
  const sh=new THREE.Shape();sh.moveTo(-1.6,-1);sh.lineTo(-1.2,15.2);sh.lineTo(1.2,15.2);sh.lineTo(9.4,-1);sh.closePath();const dg=new THREE.ExtrudeGeometry(sh,{depth:46,bevelEnabled:false});dg.translate(0,0,-23);
  const dam=add(root,dg,std(0xffffff,.9,0,{map:tex('concrete',.12,.12)}));box(root,2.6,.5,46,M.concrete,0,15.45,0);for(let z=-21;z<=21;z+=3){box(root,.08,.9,.08,M.galv,-1.2,16.1,z);box(root,.08,.9,.08,M.galv,1.2,16.1,z)}[-1.2,1.2].forEach(x=>box(root,.05,.05,44,M.galv,x,16.5,0));
  box(root,3,7,4,M.concrete,-2.6,13,6.5);building(root,M,3.4,2.4,4.4,-2.6,6.5).position.y=16.5;
  /* spillway */
  const spill=new THREE.Group();root.add(spill);for(let i=0;i<4;i++)box(spill,2.8,3.4,.6,M.concrete,0,15.6,-13.4+i*2.6);box(spill,3.2,.5,8.6,M.concrete,0,17.5,-9.5);
  const chute=box(spill,18.5,.3,7.4,M.concrete,5.3,7.1,-9.5);chute.rotation.z=-1.103;[-13.3,-5.7].forEach(z=>{const w=box(spill,18.5,1.2,.4,M.concrete,5.5,7.5,z);w.rotation.z=-1.103});
  const sw=F.add(new THREE.MeshStandardMaterial({color:0xdcecf2,transparent:true,opacity:.75,roughness:.3,emissive:0xffffff,emissiveMap:tex('flow',9,1),emissiveIntensity:.5}),1.6);const sheet=add(spill,new THREE.PlaneGeometry(18.2,6.8),sw,5.45,7.38,-9.5,false);sheet.rotation.set(-PI/2,0,0);sheet.rotation.order='ZXY';sheet.rotation.z=-1.103;
  /* penstocks, powerhouse, switchyard */
  const pm=F.add(flowMat(0x4f6f8a,0x9fd0ff,7),1.2);[4.2,8.8].forEach(z=>{pipe(root,[[5.6,6.4,z],[16.2,1.8,z]],.85,pm);for(let i=1;i<4;i++)box(root,1.4,lerp(6,1.6,i/4)+.4,2.2,M.concrete,5.6+i*2.65,(lerp(6.4,1.8,i/4)-.6)/2-.3,z)});
  pad(root,13,13,21.5,6.5,'concrete',.5,-.2);building(root,M,10,6,9,21.5,6.5,{color:0xd9d6cf,roof:0x6f7b85});box(root,3,1,5,M.concrete,27.6,.2,6.5);
  transformer(root,M,18.5,14.6,1.2);transformer(root,M,22.5,14.6,1.2);pylon(root,M,34,16,13,.3);pylon(root,M,58,23,13,.3);wire(root,[22.5,3,14.6],[34,12.4,16],1);for(const q of [-2.6,2.6])wire(root,[34+q*.3,12.4,16+q],[58+q*.3,12.4,23+q],1.6);
  const res=waterMat(0x2f6f86,.9,7),riv=waterMat(0x3d7f95,.85,5);const rw=add(root,new THREE.PlaneGeometry(64,86),res,-33.2,10,0,false);rw.rotation.x=-PI/2;const rv=add(root,new THREE.PlaneGeometry(62,11),riv,39,-.35,0,false);rv.rotation.x=-PI/2;
  let H=20,Q=1,L=10;const set=([h,q])=>{H=h;Q=q;L=lerp(6.4,14.3,norm(h,2,100));rw.position.y=L;const s=norm(q,.1,5);sw.opacity=lerp(.25,.8,s)};set(vals);
  return {size:58,cam:V(74,34,40),target:V(6,6,0),sunDir:V(.5,.8,.35),set,update(dt){const s=.4+norm(Q,.1,5)*1.6;F.step(dt,s);res.normalMap.offset.x+=dt*.004;res.normalMap.offset.y+=dt*.006;riv.normalMap.offset.x-=dt*.05*s},
    status:()=>`Reservoir level follows net head ${H} m · flow animation scaled to ${Q} m³/s`,
    get labels(){return [{pos:V(-26,L+.3,-4),name:'Reservoir',text:'Stores water and potential energy; the surface level sets the gross head.'},
      {pos:V(.6,16,16),name:'Dam',text:'Concrete gravity dam raises the water level and resists water pressure by its own weight.'},
      {pos:V(-2.6,19.2,6.5),name:'Intake',text:'Gated, screened entry that admits water to the penstocks and keeps out debris.'},
      {pos:V(10.5,5.2,8.8),name:'Penstocks',text:'Pressurised steel pipes; friction and fittings reduce gross head to net head.'},
      {pos:V(21.5,7,6.5),name:'Powerhouse',text:'Turbines convert hydraulic power ρ g Q H to shaft power, and generators convert it to electricity.'},
      {pos:V(38,.2,0),name:'Tailrace',text:'Returns turbine discharge to the river; downstream environmental flow must be maintained.'},
      {pos:V(6,8.4,-9.5),name:'Spillway',text:'Safely passes flood flows that exceed storage and turbine capacity.'},
      {pos:V(20.5,3.4,14.6),name:'Switchyard',text:'Transformers step up generator voltage for transmission.'}]}}}

/* ================= OCEAN (tidal barrage) ================= */
export function ocean(ctx,vals=[4,50]){const {root,M}=ctx;
  const hf=(x,z)=>{const az=Math.abs(z),open=x<0?1-smooth(.82,1.08,Math.hypot(x/62,z/43)):Math.max(smooth(16,40,x),1-smooth(40,50,az));const n=Math.sin(x*.3+z*.2)*.25+Math.sin(x*.11-z*.37)*.3;return lerp(4.2+n,-7,smooth(0,1,open))};
  const tg=new THREE.PlaneGeometry(240,200,150,125);tg.rotateX(-PI/2);const tp=tg.attributes.position;for(let i=0;i<tp.count;i++)tp.setY(i,hf(tp.getX(i),tp.getZ(i)));tg.computeVertexNormals();add(root,tg,std(0xffffff,1,0,{map:tex('sand',40,34)}));ground(root,'sand',900,120,-8);
  /* barrage: rock-fill embankments + concrete caisson section */
  const sh=new THREE.Shape();sh.moveTo(-9,-7);sh.lineTo(-2.8,5.2);sh.lineTo(2.8,5.2);sh.lineTo(9,-7);sh.closePath();[[-44,-15],[15,44]].forEach(([a,b])=>{const g=new THREE.ExtrudeGeometry(sh,{depth:b-a,bevelEnabled:false});g.translate(0,0,a);add(root,g,std(0xffffff,1,0,{map:tex('rock',.09,.09)}))});
  box(root,5.4,.25,90,std(0xffffff,.9,0,{map:tex('asphalt',2,30)}),0,5.3,0);
  const cm=std(0xffffff,.9,0,{map:tex('concrete',3,2)});box(root,9,12.4,30,cm,0,-.8,0);const dark=std(0x14181c,.9);
  for(let i=0;i<4;i++){const z=-11.5+i*4.6;[-1,1].forEach(s=>{const o=cyl(root,1.5,1.5,.3,dark,s*4.52,-3.6,z,24);o.rotation.z=PI/2});box(root,10.2,13.2,.9,cm,0,-.6,z+2.3)}
  box(root,10.2,13.2,.9,cm,0,-.6,-13.8);for(let i=0;i<2;i++){const z=8.6+i*4;box(root,.5,6.5,3,M.steel,-4.7,2.6,z);box(root,1,1,3.4,M.concrete,-4.7,6.3,z);box(root,10.2,13.2,.9,cm,0,-.6,z+2)}
  const gan=new THREE.Group();gan.position.set(0,5.4,-6);root.add(gan);[-3.2,3.2].forEach(x=>[-2,2].forEach(z=>box(gan,.3,5,.3,M.yellow,x,2.5,z)));box(gan,7.2,.6,4.6,M.yellow,0,5.2,0);box(gan,1.2,1,1.2,M.dark,1,4.5,0);
  building(root,M,6,3.4,5,-1,-21,{color:0xe1ded6}).position.y=5.4;transformer(root,M,3,-46,1.3).position.y=4.4;pylon(root,M,10,-58,13,.2).position.y=4.2;
  const seaM=waterMat(0x2c6f8f,.86,46),basM=waterMat(0x34808a,.86,6.5);seaM.normalScale.set(.22,.22);basM.normalScale.set(.22,.22);const sea=add(root,new THREE.PlaneGeometry(900,900),seaM,446,0,0,false);sea.rotation.x=-PI/2;const bas=add(root,new THREE.PlaneGeometry(132,100),basM,-66,0,0,false);bas.rotation.x=-PI/2;
  const foamM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,alphaMap:tex('flow',3,1)});const foams=[-1,1].map(s=>{const m=add(root,new THREE.PlaneGeometry(13,17.5),foamM,s*11.4,0,-4.6,false);m.rotation.x=-PI/2;if(s<0)m.rotation.z=PI;return m});
  let h=4,A=1.6,f=50,ph=0,lvB=0,gen=false,phase='';const set=([r,ff])=>{h=r;f=ff;A=lerp(.45,2.9,norm(r,1,8))};set(vals);
  return {size:62,cam:V(58,40,70),target:V(-4,0,-2),sunDir:V(.4,.8,.5),set,
    update(dt,t){ph+=dt*.42;const lvS=A*Math.sin(ph),rising=Math.cos(ph)>0;
      if(lvS>lvB+.02){lvB+=Math.min(lvS-lvB,dt*A*1.4);gen=false;phase='Flood tide · sluices open, basin filling'}
      else if(gen||lvB-lvS>A*.9){gen=lvB-lvS>A*.22;if(gen){lvB-=dt*A*.5;phase='Ebb generation · basin discharging through turbines'}}
      else phase=rising?'Low water · waiting for flood':'High water · holding basin level';
      sea.position.y=lvS;bas.position.y=lvB;foams[1].position.y=lvS+.06;foams[0].position.y=lvB+.06;foamM.opacity+=((gen?.75:0)-foamM.opacity)*Math.min(1,dt*3);foams[0].visible=false;foamM.alphaMap.offset.x-=dt*.5;
      seaM.normalMap.offset.x+=dt*.012;seaM.normalMap.offset.y+=dt*.007;basM.normalMap.offset.x-=dt*.006;this._d=lvB-lvS},
    status(){return `${phase} · basin − sea ≈ ${(Math.max(0,this._d||0)/A*h/2).toFixed(1)} m (range ${h} m)`},
    labels:[{pos:V(34,1,10),name:'Sea',text:'Tidal level rises and falls about every 44,700 s; spring tides give the largest range.'},
      {pos:V(-34,1,6),name:'Tidal basin',text:'Impounded area A; ideal energy per emptying is ½ρgAh², so range matters more than area.'},
      {pos:V(0,5.8,30),name:'Embankment',text:'Rock-fill barrage separates basin and sea and carries the access road.'},
      {pos:V(4.6,-1.5,-4.6),name:'Turbine caissons',text:'Low-head bulb turbines generate as the basin discharges to the falling sea (ebb generation).'},
      {pos:V(-4.7,6.6,10.6),name:'Sluice gates',text:'Open on the flood tide to refill the basin quickly, then close to hold high water.'},
      {pos:V(0,10.8,-6),name:'Gantry crane',text:'Lifts turbine units and gates for maintenance in a corrosive marine environment.'}]}}

/* ================= BIOENERGY (fixed-dome digester cutaway) ================= */
function dioramaBlock(root,{w,d,depth,zf,top='grass',side='soil',holes=[],rep=6}){
  const topM=std(0xffffff,1,0,{map:tex(top,w/5,d/5)}),sideM=std(0xffffff,1,0,{map:tex(side,rep,rep*depth/w)});
  const t=add(root,new THREE.PlaneGeometry(w,d),topM,0,0,zf-d/2,false);t.rotation.x=-PI/2;
  const bk=add(root,new THREE.PlaneGeometry(w,depth),sideM,0,-depth/2,zf-d,false);bk.rotation.y=PI;[-1,1].forEach(s=>{const m=add(root,new THREE.PlaneGeometry(d,depth),sideM,s*w/2,-depth/2,zf-d/2,false);m.rotation.y=s*PI/2});
  const b=add(root,new THREE.PlaneGeometry(w,d),std(0x5f4a36,1),0,-depth,zf-d/2,false);b.rotation.x=PI/2;
  const sh=new THREE.Shape();sh.moveTo(-w/2,-depth);sh.lineTo(w/2,-depth);sh.lineTo(w/2,0);sh.lineTo(-w/2,0);sh.closePath();holes.forEach(h=>{const p=new THREE.Path();h.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));p.closePath();sh.holes.push(p)});
  const fm=sideM.clone();fm.map=tex(side,1/w*rep,1/w*rep);fm.map.offset.set(.5,0);const fr=add(root,new THREE.ShapeGeometry(sh),fm,0,0,zf,false);fr.receiveShadow=false;return {front:fr}}
export function bio(ctx,vals=[100,25]){const {root,M}=ctx,F=flows(),zf=5,R=3.2;
  const inner=[],outer=[];const prof=(r0,o)=>{const p=[[0,-6.2-o],[r0+o,-6.2-o],[r0+o,-3.6]];for(let i=1;i<=10;i++){const a=i/10*1.36;p.push([(r0+o)*Math.cos(a)/1+0,-3.6+(r0+o)*.78*Math.sin(a)])}p.push([.5+o,-3.6+(r0+o)*.78*Math.sin(1.36)+.05],[.5+o,-.05]);return p};
  const pi=prof(R,0),po=prof(R,.32);const poly=p=>{const r=p.slice(1);return r.map(q=>[q[0],q[1]]).reverse().concat(r.map(q=>[-q[0],q[1]]))};
  const tankHole=[[3.75,-4.7],[5.3,-4.7],[5.3,-3.4],[8.4,-3.4],[8.4,-.05],[4.6,-.05],[4.6,-3.6],[3.75,-3.6]];
  dioramaBlock(root,{w:30,d:18,depth:8.5,zf,holes:[poly(pi),tankHole]});
  const cm=std(0xffffff,.9,0,{map:tex('concrete',.5,.5),side:DS});
  const lath=p=>add(root,new THREE.LatheGeometry(p.map(q=>new THREE.Vector2(q[0],q[1])),40,PI/2,PI),cm,0,0,zf);const lm=lath(pi);lm.castShadow=lm.receiveShadow=false;
  const ring=new THREE.Shape();poly(po).forEach((q,i)=>i?ring.lineTo(q[0],q[1]):ring.moveTo(q[0],q[1]));const hp=new THREE.Path();poly(pi).forEach((q,i)=>i?hp.lineTo(q[0],q[1]):hp.moveTo(q[0],q[1]));ring.holes.push(hp);add(root,new THREE.ShapeGeometry(ring),std(0xc9c8c3,.9),0,0,zf+.02,false);
  const liner=(x0,x1,y0,y1,dz)=>{const m=box(root,x1-x0,y1-y0,dz,std(0xbdbcb6,.95,0,{side:THREE.BackSide}),(x0+x1)/2,(y0+y1)/2,zf-dz/2);m.castShadow=false;return m};liner(4.6,8.4,-3.4,0,3);liner(3.75,5.3,-4.7,-3.4,1.4);box(root,.6,1.1,.05,std(0x6b5433,.6),3.45,-4.15,zf+.03).castShadow=false;
  pipe(root,[[-7.4,.3,zf-.1],[-3.35,-4.7,zf-.1]],.32,std(0xbdbcb6,.9));
  /* slurry + gas */
  const sm=std(0x6b5433,.55,0),slurry=add(root,new THREE.CylinderGeometry(R-.04,R-.04,1,40,1,false,PI/2,PI),sm,0,0,zf,false),sface=add(root,new THREE.PlaneGeometry(2*R-.08,1),std(0x7a6038,.6),0,0,zf+.012,false);
  const tslurry=box(root,3.7,1,2.9,sm,6.5,0,zf-1.5),cs=box(root,1.5,1.2,1.3,sm,4.5,-4.05,zf-.7);
  const gasM=new THREE.MeshBasicMaterial({color:0xf2d36b,transparent:true,opacity:.16,depthWrite:false,side:DS}),gas=add(root,new THREE.ShapeGeometry((()=>{const s=new THREE.Shape();poly(pi).forEach((q,i)=>i?s.lineTo(q[0],q[1]):s.moveTo(q[0],q[1]));return s})()),gasM,0,0,zf+.004,false);
  const NB=26,r=rng(8),bub=new THREE.InstancedMesh(new THREE.SphereGeometry(.07,8,6),std(0xe9dfc0,.3,0,{emissive:0x6a5a2a}),NB);root.add(bub);const B=[];for(let i=0;i<NB;i++)B.push([(r()*2-1)*(R-.5),r(),.4+r()*.6]);const d=new THREE.Object3D();
  /* surface works */
  const pit=add(root,new THREE.CylinderGeometry(1.25,1.25,1.1,28,1,true),cm,-7.4,.55,zf-1.6);cyl(root,1.15,1.15,.1,sm,-7.4,.75,zf-1.6);const pile=add(root,new THREE.ConeGeometry(1.6,1.3,18),std(0xffffff,1,0,{map:tex('soil',2,2)}),-11,.65,zf-4.5);
  box(root,4.3,.2,3.4,cm,6.5,.1,zf-1.7);box(root,1,.1,1,M.dark,7.4,.22,zf-2.2);
  cyl(root,.75,.75,.25,cm,0,.12,zf-.01);const gm=F.add(flowMat(0xd4b02a,0xffe27a,14),.6);pipe(root,[[0,-.6,zf-.3],[0,1.1,zf-.3],[0,1.1,zf-5],[9.2,1.1,zf-5],[9.2,1.1,zf-8.2],[9.8,1.1,zf-8.2]],.07,gm);cyl(root,.16,.16,.3,M.red,0,1.1,zf-1.4).rotation.x=PI/2;
  pad(root,6.5,4.6,11.4,zf-8.6);const eng=new THREE.Group();eng.position.set(11.4,.12,zf-8.6);root.add(eng);box(eng,3.6,.2,1.4,M.dark,0,.1,0);box(eng,1.5,1.1,1,M.green,-.75,.8,0);const alt=cyl(eng,.52,.52,1.2,M.cold,.85,.78,0,24);alt.rotation.z=PI/2;const fly=cyl(eng,.5,.5,.12,M.dark,.12,.78,0,24);fly.rotation.z=PI/2;cyl(eng,.07,.07,1.6,M.galv,-1.1,2.1,.3,10);box(eng,.5,.9,.7,M.grey,2,.65,0);
  [[-1.9,-2.1],[1.9,-2.1],[-1.9,2.1],[1.9,2.1]].forEach(([x,z])=>cyl(eng,.06,.06,2.8,M.galv,x*1.5,1.4,z*.95,8));const rf=box(eng,6.4,.1,4.5,std(0x8d9499,.6,.4),0,2.85,0);rf.rotation.z=.06;
  
  let m=100,eta=25,t0=0;const set=([mm,e])=>{m=mm;eta=e;pile.scale.setScalar(lerp(.45,1.5,norm(mm,10,500)))};set(vals);
  return {size:17,cam:V(4,7.5,34),target:V(.8,-2.4,zf-3),sunDir:V(-.35,.85,.55),fov:30,set,cutaway:true,maxPolar:PI*.56,
    update(dt,t){const c=.5+.5*Math.sin(t*.45),ys=lerp(-3.3,-4.3,c),yt=lerp(-2.6,-.9,c);slurry.scale.y=sface.scale.y=ys+6.2;slurry.position.y=sface.position.y=(ys-6.2)/2;tslurry.scale.y=yt+3.4;tslurry.position.y=(yt-3.4)/2;gasM.opacity=lerp(.1,.4,c);
      for(let i=0;i<NB;i++){const q=B[i];q[1]+=dt*.16*q[2];if(q[1]>1)q[1]=0;d.position.set(q[0],lerp(-6,ys,q[1]),zf+.06);d.updateMatrix();bub.setMatrixAt(i,d.matrix)}bub.instanceMatrix.needsUpdate=true;F.step(dt);fly.rotation.x+=dt*14;this._c=c},
    status(){return `Gas pressure ${this._c>.5?'high: slurry pushed into displacement tank':'low: slurry returns to digester'} · feedstock pile scaled to ${m} kg`},
    labels:[{pos:V(-7.4,1.3,zf-1.6),name:'Mixing pit and inlet',text:'Dung or organic waste is mixed with water and fed by gravity through the inclined inlet pipe.'},
      {pos:V(-1.4,-5,zf+.1),name:'Digester chamber',text:'Sealed, oxygen-free chamber where microbes break slurry down in four stages ending in methanogenesis.'},
      {pos:V(1.3,-2,zf+.1),name:'Gas storage dome',text:'Biogas (50–70% methane) collects under the fixed dome; rising pressure displaces slurry.'},
      {pos:V(6.5,-1.6,zf+.1),name:'Displacement tank',text:'Receives slurry pushed out by gas pressure; its level head supplies the gas pressure. Digestate overflows as fertiliser.'},
      {pos:V(0,1.3,zf-1.4),name:'Gas outlet and valve',text:'Main gas pipe with valve; moisture and H₂S are removed before engines.'},
      {pos:V(11.4,1.6,zf-8.6),name:'Gas engine generator',text:'Converts biogas fuel energy to electricity: E = m × LHV × η; rejected heat can be recovered.'},
      {pos:V(-11,1.5,zf-4.5),name:'Feedstock',text:'Fuel mass and moisture content determine available energy; wet fuel has a lower heating value.'}]}}

/* ================= GEOTHERMAL (binary plant cutaway) ================= */
export function geo(ctx,vals=[10,393.15]){const {root,M}=ctx,F=flows(),zf=9,D=30;
  dioramaBlock(root,{w:46,d:20,depth:D,zf,side:'strata',top:'grass',rep:1});
  const rm=new THREE.MeshStandardMaterial({color:0x5a2a1a,emissive:0xff5a1a,emissiveIntensity:1,roughness:.8,transparent:true,opacity:.92}),rs=new THREE.Shape();for(let i=0;i<=40;i++){const a=i/40*2*PI,rr=1+.12*Math.sin(a*5)+.07*Math.sin(a*9+1);const x=Math.cos(a)*17*rr,y=-24.5+Math.sin(a)*3.6*rr;i?rs.lineTo(x,y):rs.moveTo(x,y)}add(root,new THREE.ShapeGeometry(rs),rm,1,0,zf+.03,false);
  const cr=rng(12);for(let i=0;i<22;i++){const x=-13+cr()*28,y=-27+cr()*5,m=box(root,1.2+cr()*2.4,.05,.02,std(0x2a1410,1),x,y,zf+.05);m.rotation.z=(cr()-.5)*1.6;m.castShadow=false}
  const up=F.add(flowMat(0xb5551a,0xffa04a,16),-1.1),dn=F.add(flowMat(0x245caa,0x7ab8ff,16),1.1);
  pipe(root,[[-9,-25,zf+.3],[-9,1.4,zf+.3]],.36,up);pipe(root,[[11,1.4,zf+.3],[11,-25,zf+.3]],.36,dn);[-9,11].forEach(x=>{box(root,1.3,D-6,.05,std(0x4a4f55,.9),x,-(D-6)/2,zf+.04).castShadow=false;const g=new THREE.Group();g.position.set(x,0,zf-.4);root.add(g);cyl(g,.5,.5,.5,M.red,0,1.7,.7,16);cyl(g,.12,.12,1.6,M.red,0,2.4,.7,10).rotation.z=PI/2;sph(g,.3,M.red,0,2.4,.7);box(g,2,.2,2,M.concrete,0,.1,.7)});
  /* surface plant */
  pad(root,32,17,1,zf-9.5);vessel(root,M.steel,1.05,7.5,2,2.2,zf-8.5);[-.5,4.5].forEach(x=>box(root,.4,1.4,1.7,M.galv,x,.7,zf-8.5));
  const b1=F.add(flowMat(0xb5551a,0xffa04a,10),1),b2=F.add(flowMat(0x245caa,0x7ab8ff,8),1),wf=F.add(flowMat(0x3f7f5a,0x9fe0b0,12),1),wl=F.add(flowMat(0x2f5f4a,0x7fc0a0,10),1);
  pipe(root,[[-9,1.9,zf+.3],[-9,1.9,zf-8.5],[-2.6,1.9,zf-8.5]],.3,b1);pipe(root,[[6.6,1.9,zf-8.5],[11,1.9,zf-8.5],[11,1.9,zf+.3]],.3,b2);
  const tg=new THREE.Group();tg.position.set(0,0,zf-3.4);root.add(tg);box(tg,7,.3,2.6,M.dark,0,.3,0);const tcase=add(tg,new THREE.CylinderGeometry(1,1.25,2,28),M.green,-1.6,1.6,0);tcase.rotation.z=PI/2;const gen=cyl(tg,.95,.95,2.6,M.cold,1.7,1.5,0,28);gen.rotation.z=PI/2;const shaft=cyl(tg,.18,.18,1.2,M.steel,0,1.55,0,12);shaft.rotation.z=PI/2;box(tg,1,.9,.9,M.grey,3.4,.9,0);
  pipe(root,[[-1.6,3.2,zf-8.5],[-1.6,4.4,zf-8.5],[-1.6,4.4,zf-3.4],[-1.6,2.7,zf-3.4]],.28,wf);
  const acc=new THREE.Group();acc.position.set(11,0,zf-15);root.add(acc);box(acc,11,1.2,6,M.steel,0,5.4,0);for(let i=0;i<3;i++)for(let j=0;j<2;j++)cyl(acc,.12,.12,4.8,M.galv,-5+i*5,2.4,-2.7+j*5.4,8);const fans=[];for(let i=0;i<3;i++){cyl(acc,1.5,1.5,.45,M.grey,-3.6+i*3.6,6.2,0,24);const fn=new THREE.Group();fn.position.set(-3.6+i*3.6,6.48,0);acc.add(fn);for(let q=0;q<5;q++){const bl=box(fn,1.3,.03,.36,M.white,0,0,0);bl.position.set(Math.cos(q*1.2566)*.68,0,Math.sin(q*1.2566)*.68);bl.rotation.y=-q*1.2566}fans.push(fn)}
  pipe(root,[[-3.2,1.6,zf-3.4],[-5.6,1.6,zf-3.4],[-5.6,5.4,zf-3.4],[-5.6,5.4,zf-15],[5.6,5.4,zf-15]],.3,wf);pipe(root,[[9,4.9,zf-12.2],[9,.6,zf-12.2],[9,.6,zf-10.6],[4,.6,zf-10.6],[4,1.3,zf-9.4]],.2,wl);box(root,.9,.8,.9,M.yellow,9,.5,zf-11.4);
  building(root,M,5.5,3.2,4.2,-11,zf-14.5,{color:0xe2e0d9});transformer(root,M,-12.5,zf-4,1.1);pylon(root,M,-19.5,zf-15,11,.3);wire(root,[-12.5,2.6,zf-4],[-19.5,10.4,zf-15],1);
  let mf=10,Ti=393.15;const set=([m,t])=>{mf=m;Ti=t;const k=norm(t,343.15,423.15);rm.emissiveIntensity=lerp(.2,1.25,k);rm.emissive.setHSL(lerp(.01,.055,k),1,.42);up.emissiveIntensity=b1.emissiveIntensity=lerp(.6,2.2,k)};set(vals);
  return {size:26,cam:V(12,12,72),target:V(1,-11.5,zf-4),sunDir:V(-.4,.85,.5),fov:32,set,cutaway:true,maxPolar:PI*.56,
    update(dt){F.step(dt,.35+mf/22);fans.forEach(f=>f.rotation.y+=dt*8);shaft.rotation.x+=dt*18},
    status:()=>`Brine ${mf} kg/s at ${Ti} K in, 333.15 K reinjected · flow speed scaled to mass flow`,
    labels:[{pos:V(2,-24.5,zf+.3),name:'Geothermal reservoir',text:'Hot, permeable fractured rock holding brine; temperature and flow rate set the extractable heat.'},
      {pos:V(-9,-12,zf+.7),name:'Production well',text:'Brings hot brine to the surface, by natural pressure or a downhole pump.'},
      {pos:V(2,3.4,zf-8.5),name:'Heat exchanger (vaporiser)',text:'Brine heats and boils a low-boiling working fluid; the two fluids never mix in a binary plant.'},
      {pos:V(0,2.9,zf-3.4),name:'ORC turbine and generator',text:'Working-fluid vapour expands through the turbine; net efficiency is typically 8–13% at these temperatures.'},
      {pos:V(11,7,zf-15),name:'Air-cooled condenser',text:'Condenses the working fluid by rejecting heat to air, avoiding cooling-water consumption.'},
      {pos:V(11,-12,zf+.7),name:'Injection well',text:'Returns cooled brine to the reservoir to maintain pressure and dispose of fluid safely.'},
      {pos:V(9,1.1,zf-11.4),name:'Feed pump',text:'Pressurises condensed working fluid back to the vaporiser; a parasitic load on net output.'}]}}

/* ================= STORAGE (battery energy storage system) ================= */
export function storage(ctx,vals=[360,80]){const {root,M}=ctx,F=flows();ground(root,'gravel',600,110);pad(root,34,22,2,-2,'concrete',.2);
  /* cutaway container showing racks */
  const cut=new THREE.Group();cut.position.set(-6,.2,6);root.add(cut);const L=7.2,W=2.5,H=2.7,wm=std(0xffffff,.55,.25,{map:tex('container',L/1.2,1),side:DS});
  box(cut,L,.14,W,M.grey,0,.07,0);box(cut,L,H,.06,wm,0,H/2+.14,-W/2+.03);[-1,1].forEach(s=>box(cut,.06,H,W,wm,s*L/2,H/2+.14,0));box(cut,L,.08,W*.42,wm,0,H+.16,-W*.29);
  const led=[];for(let i=0;i<8;i++){const x=-L/2+.55+i*.87;box(cut,.74,H-.3,.9,M.dark,x,H/2+.05,-W/2+.56);for(let j=0;j<9;j++){box(cut,.66,.2,.05,std(0x4a5158,.5,.5),x,.42+j*.26,-W/2+1.03);const m=new THREE.MeshStandardMaterial({color:0x1b2a1f,emissive:0x35d07f,emissiveIntensity:0,roughness:.4});add(cut,new THREE.BoxGeometry(.12,.05,.02),m,x+.22,.42+j*.26,-W/2+1.065,false);led.push([m,j/9])}}
  box(cut,.9,1.1,.5,M.grey,L/2-.8,H+.75,-W*.3);
  const cons=[];for(let i=0;i<5;i++)cons.push(container(root,M,-6+(i%3)*8.6- (i>2?-4.3:0),i>2?-9:-3,{L:7.2,W:2.5,H:2.7}));
  /* PCS + transformer + grid */
  const pcs=building(root,M,4.4,2.6,2.2,12,6.2,{color:0xeef0f1,door:false});for(let i=0;i<3;i++)box(pcs,1.2,2.1,.05,M.grey,-1.4+i*1.4,1.25,1.12);
  transformer(root,M,17.2,6.2,1.25);pylon(root,M,26,2,13,.3);pylon(root,M,48,-16,13,.3);wire(root,[17.2,2.9,6.2],[26,12.4,2],1);[-2.6,2.6].forEach(q=>wire(root,[26+q*.3,12.4,2+q],[48+q*.3,12.4,-16+q],1.8));
  const cab=F.add(flowMat(0x2c3138,0x58b6ff,10),1);pipe(root,[[-2.3,.5,7.6],[9.8,.5,7.6]],.13,cab);const cab2=F.add(flowMat(0x2c3138,0x58b6ff,5),1);pipe(root,[[14.2,.5,6.2],[16,.5,6.2]],.13,cab2);
  const pvb=panelArray(root,M,{rows:2,cols:14,pitch:5,tilt:.41,x0:-2,z0:-24,face:pvFace()});
  fence(root,M,-16,13.5,22,13.5);fence(root,M,-16,-13.5,-16,13.5);
  let E=360,eta=80,soc=.2,dir=1;const set=([e,r])=>{E=e;eta=r;const n=clamp(Math.ceil(e/360)-1,0,5);cons.forEach((c,i)=>c.visible=i<n)};set(vals);
  return {size:30,cam:V(-15,9,26),target:V(2.5,1.2,1.5),sunDir:V(.35,.82,.55),set,
    update(dt){soc+=dir*dt*(dir>0?.09:.09/(eta/100));if(soc>=.98){soc=.98;dir=-1}if(soc<=.08){soc=.08;dir=1}led.forEach(([m,l])=>{m.emissiveIntensity=l<soc?2.4:0});const c=dir>0?0x58b6ff:0xffa04a;cab.emissive.setHex(c);cab2.emissive.setHex(c);F.step(dt,dir*1.4)},
    status:()=>`${dir>0?'Charging':'Discharging'} · state of charge ${(soc*100).toFixed(0)}% · ${Math.max(1,Math.ceil(E/360))} container(s) for ${E} MJ · round trip ${eta}%`,
    labels:[{pos:V(-6,1.7,7.3),name:'Battery racks',text:'Lithium-ion modules in series-parallel racks store energy electrochemically; LEDs show state of charge.'},
      {pos:V(-3.1,3.4,5.2),name:'Thermal management',text:'HVAC holds cells in a narrow temperature band; its consumption lowers round-trip efficiency.'},
      {pos:V(12,3,6.2),name:'Power conversion system',text:'Bidirectional inverter sets the power rating [kW]; rack count sets the energy rating [MJ].'},
      {pos:V(17.2,2.6,6.2),name:'Transformer',text:'Couples the storage system to the medium-voltage network.'},
      {pos:V(3.8,.9,7.6),name:'DC cabling',text:'Blue flow shows charging, orange shows discharging; losses occur in both directions.'},
      {pos:V(-2,1.8,-24),name:'PV array',text:'Midday surplus generation is shifted to the evening peak by storage.'}]}}

/* ================= CAMPUS MICROGRID (hero, energy foundations, campus design) ================= */
export function campus(ctx,vals=[.5,.4,.4,.35]){const {root,M}=ctx,F=flows();ground(root,'grass',600,90);
  const road=std(0xffffff,.95,0,{map:tex('asphalt',20,1.5)});box(root,120,.06,5,road,0,.03,17);box(root,5,.06,50,std(0xffffff,.95,0,{map:tex('asphalt',1.5,10)}),-27,.03,-6);
  const wm=(w,h)=>std(0xffffff,.8,.05,{map:tex('windows',w/7,h/7)});
  const bld=(w,h,d,x,z)=>{const g=new THREE.Group();g.position.set(x,0,z);root.add(g);box(g,w,h,d,[wm(d,h),wm(d,h),std(0xb9bcbd,.9),std(0x999,1),wm(w,h),wm(w,h)],0,h/2,0);box(g,w+.5,.5,d+.5,std(0xcfccc4,.9),0,h+.25,0);box(g,w-.4,.1,d-.4,std(0xa9adaf,.95),0,h+.52,0);return g};
  const A=bld(26,11,12,-6,0),Bb=bld(11,7.5,18,12,-3);box(root,3,3.2,.4,std(0xcfccc4,.9),-6,1.6,6.3);
  const roof=panelArray(A,M,{rows:3,cols:16,mw:1.1,mh:2,tilt:.2,pitch:3.1,hc:.5,x0:0,z0:3.1,y0:11.55,face:pvFace(),posts:false});roof.group.rotation.y=PI;
  const gpv=panelArray(root,M,{rows:3,cols:14,pitch:5,tilt:.41,x0:-2,z0:-19,face:pvFace()});gpv.group.rotation.y=PI;
  const T=[[-40,-26],[-56,-6],[-50,-46]].map(([x,z],i)=>turbine(root,M,{H:22,R:8.5,x,z,yaw:.15*i}));
  pad(root,20,6,-1,-11.5);const cons=[0,1,2].map(i=>container(root,M,-6+i*6.6,-11.5,{L:5.6}));transformer(root,M,13.5,-12,1.2);
  const cab=F.add(flowMat(0x2c3138,0xffa04a,10),1);pipe(root,[[7,.25,-16.5],[13.5,.25,-16.5],[13.5,.25,-13]],.12,cab);pipe(root,[[9,.25,-11.5],[12.2,.25,-11.5]],.12,cab);pipe(root,[[13.5,.25,-11],[13.5,.25,-9]],.12,cab);
  for(let i=0;i<7;i++){const x=-48+i*16;cyl(root,.07,.1,5,M.galv,x,2.5,20.4,8);box(root,.9,.08,.25,M.dark,x,5,20)}
  let cf=.35;const set=([p,w,s,c])=>{roof.setCount(Math.min(48,p*90));gpv.setCount(Math.max(0,p*90-48));const nw=w<=0?0:clamp(Math.ceil(w*3),1,3);T.forEach((t,i)=>t.group.visible=i<nw);const ns=s<=0?0:clamp(Math.ceil(s*3),1,3);cons.forEach((c,i)=>c.visible=i<ns);if(c!==undefined)cf=c};set(vals);
  return {size:50,cam:V(40,30,-86),target:V(-12,8,-10),sunDir:V(.45,.8,-.5),set,update(dt){T.forEach((t,i)=>t.rotor.rotation.x+=dt*(.3+cf*3.2)*(1-.12*i));F.step(dt,.8)},status:()=>'Installed equipment follows the capacity settings',
    labels:[{pos:V(-6,12.6,0),name:'Rooftop PV',text:'DC generation follows daylight; capacity [kW] sets the peak, irradiation sets the energy [MJ].'},
      {pos:V(-2,2,-24),name:'Ground-mounted PV',text:'Additional array capacity where roof area is insufficient.'},
      {pos:V(-40,23,-26),name:'Wind turbines',text:'Generate day and night at a site-dependent capacity factor, complementing solar.'},
      {pos:V(-1,3.4,-11.5),name:'Battery storage',text:'Absorbs surplus and discharges during deficits; each direction has losses (0.9 × 0.9 = 0.81 round trip).'},
      {pos:V(13.5,2.6,-12),name:'AC bus and transformer',text:'Common coupling point: generation + discharge = demand + charge + curtailment in every interval.'},
      {pos:V(12,8.6,-3),name:'Campus load',text:'Demand varies through the day; unmet demand indicates an undersized system.'}]}}
export function basics(ctx,vals=[100,30]){const s=campus(ctx,[.5,.4,.4,.3]),set0=s.set;let P=vals[0],C=vals[1];s.set=([p,c])=>{P=p;C=c;const n=norm(p,10,1000);set0([lerp(.12,1,n),lerp(.2,1,n),.34,c/100])};s.set(vals);
  s.status=()=>`Installed capacity scaled to ${P} kW rated · turbine duty scaled to capacity factor ${C}%`;return s}
export const builders={basics,pv,thermal,wind,hydro,ocean,bio,geo,storage,campus};
