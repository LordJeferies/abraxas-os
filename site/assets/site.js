(() => {
  const revealTargets = document.querySelectorAll(
    '.orientation-copy,.category-nav,.outcomes header,.outcome-grid,.section-intro,.feature-grid,.build-section header,.build-grid,.finale'
  )

  if (
    'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    revealTargets.forEach((element) => element.classList.add('reveal'))

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    )

    revealTargets.forEach((element) => observer.observe(element))
  }

  document.querySelectorAll('.feature-card').forEach((card) => {
    card.addEventListener('toggle', () => {
      if (!card.open) return

      const grid = card.closest('.feature-grid')
      if (!grid) return

      grid.querySelectorAll('.feature-card[open]').forEach((other) => {
        if (other !== card) other.removeAttribute('open')
      })
    })
  })
})()
