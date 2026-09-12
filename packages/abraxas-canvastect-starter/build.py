from pathlib import Path
p=Path(__file__).resolve().parent
css=(p/'src/style.css').read_text()
js='\n'.join((p/'src'/n).read_text() for n in ['domain.js','storage.js','importers.js','exporters.js','views.js','app.js'])
js=js.replace('</script', '<\\/script')
out=p/'dist';out.mkdir(exist_ok=True)
(out/'index.html').write_text('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Abraxas Canvastect</title><style id="canvastect-style">'+css+'</style></head><body><main id="app"></main><dialog id="modal"></dialog><div id="toast" role="status"></div><input id="file-input" type="file" hidden><script type="application/json" id="canvastect-data"></script><script id="canvastect-runtime">'+js+'</script></body></html>')
print(out/'index.html')
