(async function () {
  const host = document.getElementById('status-app')
  try {
    const s = await fetch('data/status.json', { cache: 'no-store' }).then(r => r.json())
    const pct = s.progress?.foundation ?? 0
    host.innerHTML = `
      <div class="status-top">
        <div>
          <h3>${s.currentPhase} · ${s.phaseName}</h3>
          <p>${s.nextStep}</p>
        </div>
        <span class="pill">${s.status}</span>
      </div>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <div class="status-meta">
        <div><small>Último paso</small><p>${s.lastCompletedStep}</p></div>
        <div><small>Gate actual</small><p>${s.releaseGate}</p></div>
      </div>`
  } catch (e) {
    host.textContent = 'No se pudo leer el estado del proyecto.'
  }
})()
