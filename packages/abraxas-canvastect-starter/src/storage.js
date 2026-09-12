Canvastect.Storage=(()=>{
 let dbPromise;
 function db(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open('canvastect-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('projects',{keyPath:'projectId'});const h=r.result.createObjectStore('history',{keyPath:'key'});h.createIndex('projectId','projectId');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}));}
 async function run(stores,mode,fn){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction(stores,mode);let result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Guardado cancelado'));fn(tx,v=>result=v);});}
 const get=id=>run(['projects'],'readonly',(tx,set)=>{const r=tx.objectStore('projects').get(id);r.onsuccess=()=>set(r.result);});
 const list=()=>run(['projects'],'readonly',(tx,set)=>{const r=tx.objectStore('projects').getAll();r.onsuccess=()=>set(r.result);});
 const history=id=>run(['history'],'readonly',(tx,set)=>{const r=tx.objectStore('history').index('projectId').getAll(id);r.onsuccess=()=>set(r.result.sort((a,b)=>b.at.localeCompare(a.at)));});
 async function save(doc,previous,reason){return run(['projects','history'],'readwrite',tx=>{if(previous)tx.objectStore('history').put({key:previous.projectId+'::'+previous.revisionId,projectId:previous.projectId,at:new Date().toISOString(),reason,document:previous});tx.objectStore('projects').put(doc);});}
 return {get,list,history,save};
})();
