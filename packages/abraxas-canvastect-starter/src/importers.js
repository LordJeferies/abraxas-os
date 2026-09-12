Canvastect.Importers=(()=>{
 const D=Canvastect.Domain;
 function text(content){const s=content.trim().replace(/^\uFEFF/,'');
  if(s.startsWith('CANVASTECT_TXT_V1\n'))return D.normalize(JSON.parse(s.slice(s.indexOf('\n')+1)));
  if(s.startsWith('{'))return D.normalize(JSON.parse(s));
  if(s.startsWith('<')){const html=new DOMParser().parseFromString(s,'text/html');for(const id of ['canvastect-data','canonicalData','app-data','editorialData','seed']){const el=html.getElementById(id);if(el)return D.normalize(JSON.parse(el.textContent));}throw Error('HTML sin JSON compatible. No se ejecutan scripts importados.');}
  // Documented simple editorial TXT. Unknown lines preserved in sourcePayload.
  const doc=D.empty('Proyecto TXT');doc.sourcePayload={text:content};let f=null,b=null;const unparsed=[];
  for(const line of s.split(/\r?\n/)){let m;
   if((m=line.match(/^PROYECTO:\s*(.*)$/i))){doc.title=m[1];continue;}
   if((m=line.match(/^===\s*FICHA:\s*(.*?)\s*===$/i))){f=D.newFicha();f.title=m[1];doc.fichas.push(f);b=null;continue;}
   if(!f){if(line.trim())unparsed.push(line);continue;}
   if((m=line.match(/^TIPO:\s*(\w+)/i))){f.type=m[1];continue;}
   if((m=line.match(/^(HOOK|CUERPO|CTA):\s*(.*)$/i))){f.copy[{HOOK:'hook',CUERPO:'body',CTA:'cta'}[m[1].toUpperCase()]]=m[2];b=null;continue;}
   if((m=line.match(/^\[(T[1-9]):\s*(.*?)\]\s*\((\d+(?:\.\d+)?)s?\s*-\s*(\d+(?:\.\d+)?)s?\)$/i))){b=D.block({laneId:m[1].toUpperCase(),label:m[2],start:Number(m[3]),end:Number(m[4]),kind:D.kinds[m[1].toUpperCase()]});f.blocks.push(b);continue;}
   if(b&&(m=line.match(/^(GUION|PROMPT|INSTRUCCION):\s*(.*)$/i))){if(m[1].toUpperCase()==='PROMPT')b.prompts={noText:m[2]};else b[m[1].toUpperCase()==='GUION'?'text':'instructions']=m[2];continue;}
   if(line.trim())unparsed.push(line);
  }
  if(!doc.fichas.length)throw Error('TXT no reconocido. Usa === FICHA: Título === o exporta TXT completo.');
  doc.importWarnings=unparsed.length?[unparsed.length+' líneas no mapeadas conservadas en la fuente original.']:[];return D.validate(doc);
 }
 return {text};
})();
