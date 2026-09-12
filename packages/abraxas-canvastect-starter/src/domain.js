/* Domain: pure document transformations, no browser dependencies. */
globalThis.Canvastect = globalThis.Canvastect || {};
Canvastect.Domain = (() => {
 const id=()=>globalThis.crypto?.randomUUID?.() || 'id-'+Date.now()+'-'+Math.random().toString(36).slice(2);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const tracks=[['T1','A-ROLL','#a7bfcb'],['T2','XR','#d298e4'],['T3','IMAGES','#9b8dca'],['T4','MOTION','#d28e95'],['T5','B-ROLL','#8f785e'],['T6','VO JOC','#a8caa8'],['T7','SFX','#dfcf78'],['T8','MUSIC','#86b3a3'],['T9','CAPTIONS','#c9c7c8']];
 const lane={aroll:'T1',a_roll:'T1',xr:'T2',xroll:'T2',images:'T3',image:'T3',motion:'T4',broll:'T5',b_roll:'T5',vo:'T6',sfx:'T7',music:'T8',captions:'T9',story:'story'};
 const kinds={T1:'a_roll',T2:'xr',T3:'images',T4:'motion',T5:'b_roll',T6:'vo',T7:'sfx',T8:'music',T9:'captions',story:'story'};
 const isVideo=f=>['intro','vertical','horizontal','full_episode','video'].includes(f.type);
 function newFicha(type='intro') {return {id:id(),type,title:'Nueva '+type,copy:{hook:'',body:'',cta:''},maturity:'beta',status:'draft',blocks:[],items:[],routeDurations:{source:0},publishing:{},note:''};}
 function empty(title='Mi proyecto'){return {schemaVersion:'canvastect.v1',projectId:id(),revisionId:id(),title,fichas:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};}
 function block(e){return {...clone(e),id:e.id||e.slotKey||id(),laneId:e.laneId||lane[e.track]||lane[e.kind]||'unknown',start:e.start??0,end:e.end??((e.start??0)+(e.duration??1)),routes:e.routes?.length?e.routes:['source'],parentId:e.parentId||e.parentBlockId||null,label:e.label||e.title||e.role||e.kind||'Elemento'};}
 function normalize(raw){
  if(raw.schemaVersion==='canvastect.v1'){validate(raw);return clone(raw);}
  const source=raw.pieces||raw.fichas;
  if(!Array.isArray(source))throw Error('No hay pieces o fichas. Usa el TXT estructurado de ejemplo.');
  const doc=empty(raw.title||raw.episode?.title||'Proyecto importado');doc.projectId=raw.projectId||id();doc.sourcePayload=clone(raw);
  doc.fichas=source.map(p=>{
   const f={...clone(p),id:p.id||p.fichaId||id(),type:p.type||p.contentType||'note',title:p.title||'Sin título',copy:typeof p.copy==='string'?{fullCopy:p.copy}:p.copy||{},maturity:p.maturity||'beta',status:['draft','in_production','ready_for_review','confirmed_publish','published'].includes(p.status)?p.status:'draft',blocks:(p.timeline||p.blocks||[]).map(block),items:[],routeDurations:p.routeDurations||{source:p.durationSeconds||0}};
   f.items=(p.staticProduction?.items||p.carouselSlides||[]).map((s,i)=>({...clone(s),id:s.itemId||s.id||id(),title:s.title||s.headline||'Lámina '+(i+1),text:s.text||s.body||'',prompt:s.visualPrompt||s.visual?.promptNoText||s.visual?.prompt||''}));
   // Expand legacy slots only if no separate linked image already represents them.
   for(const parent of [...f.blocks])for(const slot of parent.childSlots||[]){
    if(!f.blocks.some(b=>b.assetSlotKey===slot.slotKey||(b.parentId===parent.id&&b.start===slot.start&&b.end===slot.end&&b.laneId==='T3')))
     f.blocks.push(block({...slot,id:slot.slotKey,laneId:'T3',kind:'images',parentId:parent.id,routes:parent.routes}));
   }
   return f;
  });validate(doc);return doc;
 }
 function validate(doc){
  if(!doc||!doc.projectId||!Array.isArray(doc.fichas))throw Error('Documento inválido.');
  const ids=new Set;
  for(const f of doc.fichas){if(!f.id||ids.has(f.id))throw Error('ID de ficha ausente/duplicado.');ids.add(f.id);if(!Array.isArray(f.blocks)||!Array.isArray(f.items))throw Error('Faltan blocks/items en '+f.id);
   const bs=new Set;for(const b of f.blocks){if(!b.id||bs.has(b.id))throw Error('ID de bloque duplicado: '+b.id);bs.add(b.id);if(!Number.isFinite(b.start)||!Number.isFinite(b.end)||b.start<0||b.end<=b.start)throw Error('Intervalo inválido: '+b.id);}
  }return doc;
 }
 const routes=f=>[...new Set(['source',...Object.keys(f.routeDurations||{}),...f.blocks.flatMap(b=>b.routes||['source'])])];
 const events=(f,r)=>f.blocks.filter(b=>(b.routes||['source']).includes(r));
 const duration=(f,r)=>Math.max(1,f.routeDurations?.[r]||0,...events(f,r).map(b=>timing(b,r).end));
 const timing=(b,r)=>b.routeOverrides?.[r]||{start:b.start,end:b.end};
 function visibleEvents(f,r){return events(f,r).map(b=>({...b,...timing(b,r)}));}
 function active(f,r,t){return visibleEvents(f,r).filter(b=>b.start<=t&&t<b.end);}
 function setTimes(f,bid,r,start,end){
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start)throw Error('Inicio ≥ 0 y final > inicio.');
  const b=f.blocks.find(b=>b.id===bid);if(!b)throw Error('Bloque no encontrado');
  const prev=timing(b,r);const delta=start-prev.start;const moving=Math.abs((end-start)-(prev.end-prev.start))<1e-7;
  const children=f.blocks.filter(c=>c.parentId===bid&&(c.routes||['source']).includes(r));
  if(!moving&&children.some(c=>{const t=timing(c,r);return t.start<start||t.end>end;}))throw Error('El nuevo intervalo deja hijos fuera. Ajusta primero los hijos; no se redistribuyen automáticamente.');
  if(b.laneId==='T2'&&visibleEvents(f,r).some(c=>c.id!==bid&&c.laneId==='T2'&&start<c.end&&end>c.start))throw Error('El XR se superpone con otro XR en esta ruta.');
  const apply=(x,s,e)=>{if((x.routes||[]).length>1){x.routeOverrides={...x.routeOverrides,[r]:{start:s,end:e}};}else{x.start=s;x.end=e;x.duration=e-s;}};
  apply(b,start,end);if(moving){const descendants=new Set([bid]);let changed=true;while(changed){changed=false;for(const c of f.blocks)if(c.parentId&&descendants.has(c.parentId)&&!descendants.has(c.id)){descendants.add(c.id);changed=true;}}for(const c of f.blocks)if(c.id!==bid&&descendants.has(c.id)&&(c.routes||['source']).includes(r)){const t=timing(c,r);apply(c,t.start+delta,t.end+delta);}}
 }
 function missing(f){const m=[];if(!f.title||/^Nueva /.test(f.title))m.push('Título por definir');if(!f.copy?.fullCopy&&!f.copy?.body)m.push('Copy pendiente');if(isVideo(f)&&!f.blocks.length)m.push('Timeline vacío');if(!isVideo(f)&&!f.items.length)m.push('Contenido pendiente');const n=f.blocks.filter(b=>['T2','T3'].includes(b.laneId)&&!b.prompts?.noText&&!b.asset?.promptNoText&&!b.assets?.length).length;if(n)m.push(n+' recursos visuales por desarrollar');return m;}
 function touch(doc){doc.parentRevisionId=doc.revisionId;doc.revisionId=id();doc.updatedAt=new Date().toISOString();return doc;}
 return {id,clone,tracks,lane,kinds,isVideo,newFicha,empty,block,normalize,validate,routes,events,visibleEvents,duration,active,setTimes,missing,touch};
})();
