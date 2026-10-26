(function(){
const cv=document.getElementById('cv');
if(!window.THREE||!cv){document.querySelector('.view').style.display='none';return;}
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
renderer.shadowMap.enabled=true;renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(38,1,.1,100);
scene.add(new THREE.HemisphereLight(0xffffff,0xcfc4a8,.55));
const sun=new THREE.DirectionalLight(0xfff1d6,.6);sun.position.set(5,8,4);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:1,far:25});scene.add(sun);
const root=new THREE.Group();scene.add(root);
let G=null,rot=.6,auto=true,drag=false,lx=0,resume=null,tgtDist=9.6;
function size(){const w=cv.clientWidth,h=cv.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
new ResizeObserver(size).observe(cv);size();
cv.addEventListener('pointerdown',e=>{drag=true;auto=false;lx=e.clientX;cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing'});
cv.addEventListener('pointermove',e=>{if(!drag)return;rot+=(e.clientX-lx)*.01;lx=e.clientX});
const up=()=>{drag=false;cv.style.cursor='grab';clearTimeout(resume);resume=setTimeout(()=>auto=true,2500)};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);

const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.85,metalness:0},o||{}));
function add(mesh,x,y,z){mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;G.add(mesh);return mesh}
const box=(w,h,d,c,x,y,z,o)=>add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c,o)),x,y,z);
function edges(m){const l=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color:0x1E4C4C,transparent:true,opacity:.55}));m.add(l)}
const has=(k,v)=>(S[k]||'').split(', ').includes(v);
const starts=(k,v)=>(S[k]||'').indexOf(v)>=0;

const palettes={'Blancos y madera clara':['#F1EDE4','#C9A877'],'Grises y negro':['#BFBFBC','#2B2B2B'],'Tierras y terracota':['#E3CCA8','#B5683F'],'Verdes y madera oscura':['#CBD3BF','#5A4330'],'Azules y arena':['#EFE6D2','#5E7E92']};
const facade={'Ladrillo visto':'#A9553B','Revoque blanco':'#F4F1EA','Madera':'#A67C52','Piedra':'#A39C8E','Hormigón visto':'#A5A6A3','Metal / vidrio':'#8D969A'};
const m2map={'Hasta 150':130,'150–250':200,'250–350':300,'350–500':420,'Más de 500':600};
const stageNames=['Terreno y replanteo','Cimientos','Implantación en el lote','Volúmenes y espacios','Techo, color y materiales','Obra casi lista','Listo para revisión'];

function build(stage){
 if(G){root.remove(G);G.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
 G=new THREE.Group();root.add(G);const tags=[];
 const sel=k=>(S[k]||'').split(', ').filter(Boolean);
 const ex=sel('extras');
 // orientación: dirección del frente y del norte
 const nv={'Norte':[0,1],'Sur':[0,-1],'Este':[1,0],'Oeste':[-1,0]}[S.orientacion];
 if(nv){sun.position.set(nv[0]*8,8,nv[1]*8);tags.push('frente '+S.orientacion.toLowerCase())}else sun.position.set(5,8,4);
 // lote y relieve
 const m2l=parseFloat(S.m2lote)||800, L=Math.max(2.2,Math.min(4.2,Math.sqrt(m2l)/10));
 const slope=S.desnivel==='Con desnivel'?.10:S.desnivel==='Con pendiente fuerte'?.22:0;
 const water=sel('vista').some(v=>v.indexOf('laguna')>=0);
 const hy=(x,z)=>{let y=-slope*z;if(water&&z>2.2)y-=.18;return y};
 const gg=new THREE.PlaneGeometry(6,6,12,12);gg.rotateX(-Math.PI/2);
 const pos=gg.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,hy(pos.getX(i),pos.getZ(i)));gg.computeVertexNormals();
 const ground=new THREE.Mesh(gg,M('#B3BF93'));ground.receiveShadow=true;G.add(ground);
 (function(){const h=3,N=12,bot=-.7,v=[];
  [[[-h,-h],[h,-h]],[[h,-h],[h,h]],[[h,h],[-h,h]],[[-h,h],[-h,-h]]].forEach(([a,b])=>{for(let i=0;i<N;i++){const p=[a[0]+(b[0]-a[0])*i/N,a[1]+(b[1]-a[1])*i/N],q=[a[0]+(b[0]-a[0])*(i+1)/N,a[1]+(b[1]-a[1])*(i+1)/N];
   v.push(p[0],hy(p[0],p[1]),p[1],q[0],hy(q[0],q[1]),q[1],q[0],bot,q[1],p[0],hy(p[0],p[1]),p[1],q[0],bot,q[1],p[0],bot,p[1])}});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();
  G.add(new THREE.Mesh(g,M('#8E7B5A',{side:THREE.DoubleSide})));
  const bt=new THREE.Mesh(new THREE.PlaneGeometry(6,6),M('#6E5F45'));bt.rotation.x=Math.PI/2;bt.position.y=bot;G.add(bt)})();
 const lot=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-L/2,-L/2],[L/2,-L/2],[L/2,L/2],[-L/2,L/2]].map(a=>new THREE.Vector3(a[0],.01,a[1]))),new THREE.LineBasicMaterial({color:0xC2AD7A}));G.add(lot);
 if(S.m2lote)tags.push(S.m2lote+' m² lote');
 if(slope)tags.push(S.desnivel.toLowerCase());
 if(water){const w=new THREE.Mesh(new THREE.BoxGeometry(6,.1,1.0),M('#6FA3B5',{transparent:true,opacity:.8,roughness:.2}));w.position.set(0,-.24-slope*2.6,2.5);G.add(w);tags.push('frente al agua')}
 // flecha norte
 if(nv){const a=new THREE.Mesh(new THREE.ConeGeometry(.07,.22,3),M('#C2AD7A'));a.position.set(nv[0]*2.7,.12,nv[1]*2.7);G.add(a);tags.push('norte marcado')}
 // entorno
 const vs=sel('vista');
 if(vs.includes('Calle y vecinos')){box(6,.02,.5,'#6E6E6E',0,.015,-2.75);[-2,-.6,1.1].forEach(x=>box(.7,.35,.5,'#CFC8B8',x,.2,-2.15));tags.push('calle y vecinos')}
 if(vs.includes('Esquina')){box(.5,.02,6,'#6E6E6E',-2.75,.015,0);tags.push('esquina')}
 // programa
 const floors=S.pisos==='Una planta'?1:S.pisos==='Dos plantas'?2:(S.pisos||'').indexOf('Tres')===0?3:1;
 const area=(m2map[S.m2casa]||250);
 let wm=Math.sqrt(area/floors*1.5),dm=area/floors/wm;
 const W=Math.min(wm/10,L*.82),D=Math.min(dm/10,L*.62);
 const fh=.3, est=S.estilo||'';
 const pal=palettes[S.paleta]||['#E8E2D6','#8C7355'];
 const fac=sel('fachada');
 const wall=(fac[0]&&facade[fac[0]])||pal[0];
 const accent=pal[1];
 const hx=0,hz=-.15*L;
 const showBody=stage>=3||!!S.pisos||!!S.m2casa;
 const showRoof=showBody&&(stage>=4||!!S.techo||!!S.estilo);
 const solid=showRoof||stage>=4;
 const wo={transparent:!solid,opacity:solid?1:.55};
 const wallCol=solid?wall:'#D9D2C0';
 // personas, chicos, mascotas
 const n=S.personas==='6 o más'?6:parseInt(S.personas)||0;
 for(let i=0;i<n;i++){const f=new THREE.Mesh(new THREE.CylinderGeometry(.045,.05,.26,10),M(i%2?'#1E4C4C':'#C2AD7A'));f.position.set(-L/2-.35+(i%3)*.18,.14,L/2-.2-Math.floor(i/3)*.2);f.castShadow=true;G.add(f)}
 if(n)tags.push(n+' pers.');
 const kids=sel('chicos').filter(k=>k.indexOf('Sí')===0);
 kids.forEach((k,i)=>{const f=new THREE.Mesh(new THREE.CylinderGeometry(.03,.035,.14,10),M('#E09A4B'));f.position.set(-L/2-.35+i*.14,.08,L/2+.1);f.castShadow=true;G.add(f)});
 if(kids.length)tags.push('chicos');
 const pets=sel('mascotas').filter(m=>m!=='No');
 pets.forEach((m,i)=>{const big=m.indexOf('grande')>=0,sm=big?1:.7;const d=new THREE.Mesh(new THREE.BoxGeometry(.16*sm,.08*sm,.06*sm),M(m.indexOf('Gato')===0?'#9A9A9A':'#6B4F36'));d.position.set(-L/2-.2+i*.2,.05,L/2+.3);G.add(d)});
 if(pets.length)tags.push('mascotas');
 // estacas si aún no hay cuerpo
 if(!showBody){[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(c=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.3),M('#C2AD7A'));p.position.set(hx+c[0]*W/2,.15,hz+c[1]*D/2);G.add(p)})}
 else{box(W+.16,.04,D+.16,'#6E6A60',hx,.02,hz)}
 // árboles
 {const tn=vs.includes('Vista al verde')?9:5;for(let i=0;i<tn;i++){const a=i/tn*Math.PI*2+.4,r=L*.62+((i*37)%5)*.06;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)>2.8||Math.abs(z)>2.8||(z>2&&water)||(vs.includes('Calle y vecinos')&&z<-1.9))continue;const h=.35+((i*13)%4)*.07,y=hy(x,z);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,h*.5),M('#6B4F36')),x,y+h*.25,z);add(new THREE.Mesh(new THREE.ConeGeometry(.17,h,8),M('#58734F')),x,y+h*.75,z)}
  if(vs.includes('Vista al verde'))tags.push('vista al verde')}
 // exteriores que aparecen apenas se eligen
 const galZ=hz+D/2+.22;
 const gal=(S.asado&&S.asado!=='Casi nunca')||(S.quincho||'').indexOf('galería')>=0||ex.includes('Pileta');
 const gx=hx-W*.1;
 if(gal){box(W*.55,.03,.44,'#B9A586',gx,.055,galZ);box(W*.55,.025,.5,accent,gx,.04+fh*.78,galZ);[-.27,.27].forEach(k=>box(.025,fh*.74,.025,accent,gx+k*W,.04+fh*.37,galZ+.2));tags.push('galería')}
 if(S.asado&&S.asado!=='Casi nunca'&&(S.quincho||'').indexOf('No necesito')<0){const q=(S.quincho||'');if(q.indexOf('Quincho separado')<0&&q.indexOf('living')<0){box(.16,.09,.1,'#2B2B2B',gx+W*.2,.1,galZ);box(.1,.02,.06,'#E0702B',gx+W*.2,.16,galZ,{emissive:0x7a2a08})}tags.push('parrilla')}
 if((S.quincho||'').indexOf('Quincho separado')===0){box(.5,fh*.7,.4,wallCol,hx-W/2-.55,.04+fh*.35,hz-D*.2,wo);box(.62,.03,.52,accent,hx-W/2-.55,.04+fh*.7+.015,hz-D*.2);tags.push('quincho')}
 if(ex.includes('Pileta')){const px=hx+W*.28,pz=hz+D/2+.85;box(W*.45+.1,.02,.65,'#E7DFCB',px,.02,pz);box(W*.45,.03,.55,'#5EB0C9',px,.03,pz,{roughness:.15,transparent:true,opacity:.9});tags.push('pileta')}
 if(ex.includes('Huerta')){box(.5,.02,.3,'#7C9A57',hx-W/2-.3,.025,hz+D/2+.5);[0,1,2].forEach(i=>box(.4,.03,.04,'#5E7A3E',hx-W/2-.3,.04,hz+D/2+.4+i*.1));tags.push('huerta')}
 if(S.movilidad&&S.movilidad!=='No'){const r=box(.3,.02,.5,'#B9A586',hx+W*.32,.03,hz+D/2+.3);r.rotation.x=.12;tags.push('rampa de acceso')}
 const annex=ex.filter(x=>['Gimnasio','Sala de cine','Playroom','Bodega'].includes(x));
 if(annex.length){const aw=.55+annex.length*.1;box(aw,fh*.8,.5,wallCol,hx+W/2+aw/2-.05,.04+fh*.4,hz-D/2-.3,wo);box(aw+.06,.03,.56,accent,hx+W/2+aw/2-.05,.04+fh*.8+.015,hz-D/2-.3);annex.forEach(a=>tags.push(a.toLowerCase()))}
 if(S.oficina==='Necesito un estudio aparte'){box(.4,fh*.7,.4,wallCol,hx-W/2-.35,.04+fh*.35,hz+D*.3,wo);box(.46,.03,.46,accent,hx-W/2-.35,.04+fh*.7+.015,hz+D*.3);tags.push('estudio aparte')}
 if(S.visitas==='Seguido'||S.visitas==='Vive alguien más con frecuencia'){box(.5,fh*.7,.4,wallCol,hx+W/2+.4,.04+fh*.35,hz+D/2+.4,wo);box(.56,.03,.46,accent,hx+W/2+.4,.04+fh*.7+.015,hz+D/2+.4);tags.push('cuarto de huéspedes')}
 if(ex.includes('Domótica'))tags.push('domótica');
 // textos de interiores
 ['lavadero','cocina','oficina','living'].forEach(k=>{if(S[k]&&!(k==='oficina'&&S[k]==='Necesito un estudio aparte')&&S[k]!=='No')tags.push(S[k].toLowerCase())});
 if(S.dorm)tags.push(S.dorm+' dorm.');
 if(S.suite&&S.suite!=='No necesito')tags.push('suites: '+S.suite.toLowerCase());
 if(!showBody)return fin(tags,stage);
 // cuerpo de la casa
 const glaz=(est==='Contemporánea'||fac.includes('Metal / vidrio')||S.living==='Muy conectados al jardín')?.55:.3;
 const off=(est==='Contemporánea'||est==='Minimalista');
 for(let i=0;i<floors;i++){const sh=(i>0&&off)?.88:1;const cx=hx+(i>0?(W*(1-sh))/2:0);
  const col=i===0&&fac[1]?(solid?facade[fac[1]]:'#D9D2C0'):wallCol;
  const b=box(W*sh,fh-.01,D*sh,col,cx,.04+fh/2+i*fh,hz,wo);edges(b);
  if(solid){const k=Math.max(2,Math.round(W/.55)),ww=(W*sh*.8)/k;for(let j=0;j<k;j++){const win=new THREE.Mesh(new THREE.PlaneGeometry(ww*.7,fh*.55*(1+glaz)),M('#27404A',{roughness:.2,metalness:.3}));win.position.set(cx-W*sh*.4+ww*(j+.5),.04+fh*.55+i*fh,hz+D*sh/2+.006);G.add(win)}}}
 if(solid){if(fac[2])box(W*.22,fh*.95,.025,facade[fac[2]],hx-W*.3,.04+fh*.5,hz+D/2+.015,wo);
  if(fac[1]&&floors>1)box(W*.22,fh*.95,.025,facade[fac[1]],hx+W*.3,.04+fh*.5,hz+D/2+.02,wo)}
 if(S.living==='Doble altura'){box(W*.3,floors*fh+.12,.03,'#27404A',hx+W*.12,.04+(floors*fh+.12)/2,hz+D/2+.03,{roughness:.2});tags.push('doble altura')}
 tags.push(floors+(floors>1?' plantas':' planta'),area+' m²');
 if(has('extras','Cochera cubierta')){const gw=W*.38;box(gw,fh*.8,D*.6,wallCol,hx+W/2+gw/2,.04+fh*.4,hz+D*.1,wo);box(gw+.06,.03,D*.6+.06,accent,hx+W/2+gw/2,.04+fh*.8+.015,hz+D*.1);tags.push('cochera')}
 const top=.04+floors*fh;
 // techo
 const rt=S.techo||'';
 let kind=rt.indexOf('cuatro')>=0?'hip':rt.indexOf('dos aguas')>=0?'gable':rt.indexOf('plano')>=0?'flat':rt==='Chapa'?'chapa':null;
 if(!kind&&showRoof)kind=(est==='Española / Mediterránea')?'hip':est==='Campo / Rústica'?'gable':'flat';
 let rh=0;const Wt=W*(floors>1&&off?.88:1),cxr=hx+(floors>1&&off?W*.06:0);
 if(kind&&showRoof){
  const tej=(kind==='chapa')?'#6F7478':(rt.indexOf('Teja')===0||est==='Española / Mediterránea')?'#B5683F':'#7A6A58';
  const o=.12;rh=Math.max(.2,Math.min(.42,W*.14));
  if(kind==='flat'){box(Wt+o*2,.04,D+o*2,accent,cxr,top+.02,hz)}
  else if(kind==='hip'){const c=new THREE.Mesh(new THREE.ConeGeometry(Math.SQRT1_2,rh,4),M(tej));c.rotation.y=Math.PI/4;c.scale.set(Wt+o*2,1,D+o*2);add(c,cxr,top+rh/2,hz)}
  else{const sh=new THREE.Shape();sh.moveTo(-(Wt/2+o),0);sh.lineTo(Wt/2+o,0);sh.lineTo(0,rh);sh.lineTo(-(Wt/2+o),0);const gm=new THREE.ExtrudeGeometry(sh,{depth:D+o*2,bevelEnabled:false});gm.translate(0,0,-(D/2+o));add(new THREE.Mesh(gm,M(tej)),cxr,top,hz)}
  tags.push(kind==='flat'?'techo plano':kind==='chapa'?'techo de chapa':kind==='hip'?'techo a cuatro aguas':'techo a dos aguas');
 }
 if(ex.includes('Panel solar')){const flat=!kind||kind==='flat'||!showRoof;const p=box(.4,.015,.25,'#1B2B3A',cxr+(flat?0:Wt*.18),flat?top+.07:top+rh*.55+.02,hz+(flat?0:0),{roughness:.3});if(flat)p.rotation.x=-.4;else p.rotation.z=-Math.atan2(rh,Wt/2);tags.push('paneles solares')}
 if(est&&est!=='Todavía no sé')tags.push(est.toLowerCase());
 if(S.paleta&&S.paleta!=='Que me sugiera Fede')tags.push(S.paleta.toLowerCase());
 fac.forEach(f=>tags.push('fachada: '+f.toLowerCase()));
 return fin(tags,stage);
}
function fin(tags,stage){
 const st=Math.min(stage,6);
 document.getElementById('vst').textContent=stageNames[st];
 document.getElementById('vtg').innerHTML=[...new Set(tags)].slice(0,24).map(t=>'<span>'+t+'</span>').join('');
 document.getElementById('vtx').textContent=st>=6?'Este bosquejo es solo una guía para vos. Federico arma tu render con tus respuestas.':'Arrastrá para girar. Se va armando con tus respuestas.';
}
let sig='';
window.upd=function(){const st=cur<0?0:cur;const k=JSON.stringify(S)+st;if(k===sig)return;sig=k;try{build(st)}catch(e){console.error(e)}};
function loop(){requestAnimationFrame(loop);if(auto)rot+=.004;root.rotation.y=rot;
 const r=tgtDist;cam.position.set(0,r*.42,r*.95);cam.lookAt(0,.3,0);renderer.render(scene,cam)}
loop();upd();
})();
