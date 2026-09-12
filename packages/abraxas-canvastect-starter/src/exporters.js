Canvastect.Exporters=(()=>{
 const safe=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 async function download(name,content,type='text/plain;charset=utf-8'){
  if(window.__TAURI__?.core?.invoke){await window.__TAURI__.core.invoke('save_export',{name,content});return;}
  const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 function html(doc){const css=document.getElementById('canvastect-style').textContent;const runtime=document.getElementById('canvastect-runtime').textContent;
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark"><title>Lienzo · Canvastect</title><style id="canvastect-style">'+css+'</style></head><body><main id="app"></main><dialog id="modal"></dialog><div id="toast" role="status"></div><input id="file-input" type="file" hidden><script type="application/json" id="canvastect-data">'+safe(doc)+'</script><script id="canvastect-runtime">'+runtime+'<'+ '/script></body></html>';
 }
 function exportDoc(doc,format){Canvastect.Domain.validate(doc);const name=doc.projectId.replace(/[^a-zA-Z0-9_-]/g,'_');return download(name+(format==='html'?'.html':'.txt'),format==='html'?html(doc):'CANVASTECT_TXT_V1\n'+JSON.stringify(doc,null,2),format==='html'?'text/html;charset=utf-8':'text/plain;charset=utf-8');}
 return {html,exportDoc,download};
})();
