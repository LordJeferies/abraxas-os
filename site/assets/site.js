(() => {
  const $ = (q, ctx = document) => ctx.querySelector(q)
  const $$ = (q, ctx = document) => [...ctx.querySelectorAll(q)]

  document.body.classList.add('loading')

  const safeFetchJSON = async (url, fallback = {}) => {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`${res.status}`)
      return await res.json()
    } catch (error) {
      console.warn(`Could not load ${url}`, error)
      return fallback
    }
  }

  const preloader = $('#preloader')
  const counter = $('#preloader-count')

  const runPreloader = () => new Promise((resolve) => {
    let value = 0
    const timer = setInterval(() => {
      value += Math.max(1, Math.ceil((100 - value) * 0.12))
      value = Math.min(100, value)
      if (counter) counter.textContent = String(value).padStart(2, '0')
      if (value >= 100) {
        clearInterval(timer)
        setTimeout(resolve, 180)
      }
    }, 28)
  })

  const updateStatus = async () => {
    const state = await safeFetchJSON('data/status.json', {})
    const project = state.project || state.projectState || state
    const progress = project.progress || {}

    const foundation = Number(progress.foundation ?? 0)
    const media = Number(progress.mediaCompatibility ?? 0)

    const percent = $('#build-percent')
    const f1 = $('#f1-state')
    const title = $('#status-title')
    const next = $('#status-next')

    if (percent) percent.textContent = `${foundation}%`
    if (f1) f1.textContent = media > 0 ? `${media}% · In progress` : 'Next'
    if (title) title.textContent = `${project.currentPhase || 'F1'} · ${project.phaseName || 'Media Compatibility Lab'}`
    if (next) next.textContent = project.nextStep || 'Construyendo el siguiente gate.'
  }

  const setupCursor = () => {
    const glow = $('#cursor-glow')
    if (!glow || window.matchMedia('(pointer:coarse)').matches) return

    window.addEventListener('pointermove', (event) => {
      glow.style.opacity = '1'
      glow.style.left = `${event.clientX}px`
      glow.style.top = `${event.clientY}px`
    }, { passive: true })
  }

  const setupRail = () => {
    const links = $$('.chapter-rail a')
    const chapters = $$('[data-chapter]')

    if (!('IntersectionObserver' in window)) return

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        links.forEach((link) => link.classList.remove('active'))
        const match = links.find((link) => link.getAttribute('href') === `#${entry.target.id}`)
        match?.classList.add('active')
      })
    }, { rootMargin: '-40% 0px -45% 0px', threshold: 0 })

    chapters.forEach((chapter) => io.observe(chapter))
  }

  const setupAnimations = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !window.gsap) return

    const gsap = window.gsap

    if (window.ScrollTrigger) {
      gsap.registerPlugin(window.ScrollTrigger)
    }

    if (window.Lenis) {
      const lenis = new window.Lenis({
        smoothWheel: true,
        lerp: 0.08,
        wheelMultiplier: 0.9,
      })

      lenis.on('scroll', () => window.ScrollTrigger?.update())

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000)
      })

      gsap.ticker.lagSmoothing(0)
    }

    gsap.set('.hand-left', { xPercent: -10, scale: 1.08 })
    gsap.set('.hand-right', { xPercent: 10, scale: 1.08 })
    gsap.set('.hero-copy>*', { y: 35, opacity: 0 })

    const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
    intro
      .to('.hand-left', { xPercent: 0, scale: 1, duration: 1.9 }, 0)
      .to('.hand-right', { xPercent: 0, scale: 1, duration: 1.9 }, 0)
      .to('.touch-point', { scale: 1, duration: .5, ease: 'back.out(2)' }, 1.42)
      .to('.hero-copy>*', { y: 0, opacity: 1, stagger: .1, duration: 1.0 }, .65)

    if (window.ScrollTrigger) {
      gsap.to('.hero-art', {
        scale: 1.15,
        filter: 'brightness(.76)',
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })

      $$('.chapter').forEach((chapter) => {
        const copy = $('.chapter-copy', chapter)
        if (!copy) return

        gsap.from(copy.children, {
          y: 44,
          opacity: 0,
          stagger: .08,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: copy,
            start: 'top 72%',
          },
        })
      })

      gsap.to('.source-orbit', {
        rotate: 24,
        ease: 'none',
        scrollTrigger: {
          trigger: '.chapter-source',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      })

      gsap.from('.sun-white', {
        xPercent: -30,
        opacity: .4,
        scrollTrigger: {
          trigger: '.chapter-intelligence',
          start: 'top 80%',
          end: 'center center',
          scrub: 1,
        },
      })

      gsap.from('.sun-black', {
        xPercent: 30,
        opacity: .4,
        scrollTrigger: {
          trigger: '.chapter-intelligence',
          start: 'top 80%',
          end: 'center center',
          scrub: 1,
        },
      })

      gsap.to('.eclipse-core', {
        scale: 1.45,
        boxShadow: '0 0 140px rgba(124,92,255,.62)',
        scrollTrigger: {
          trigger: '.chapter-intelligence',
          start: 'top 72%',
          end: 'center center',
          scrub: 1,
        },
      })

      gsap.from('.timeline-scene .clip,.timeline-scene .cue', {
        scaleX: 0,
        transformOrigin: 'left center',
        stagger: .08,
        duration: .75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.timeline-scene',
          start: 'top 68%',
        },
      })

      gsap.to('.scale-word', {
        scale: 1.55,
        letterSpacing: '-.16em',
        ease: 'none',
        scrollTrigger: {
          trigger: '.chapter-scale',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      })

      gsap.to('.scale-marquee div', {
        xPercent: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: '.chapter-scale',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })

      gsap.from('.review-card', {
        y: 60,
        opacity: 0,
        rotateX: 10,
        stagger: .11,
        duration: .9,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.review-board',
          start: 'top 66%',
        },
      })

      gsap.from('.build-lines div', {
        x: 55,
        opacity: 0,
        stagger: .12,
        scrollTrigger: {
          trigger: '.build-lines',
          start: 'top 76%',
        },
      })
    }
  }

  window.addEventListener('DOMContentLoaded', async () => {
    setupCursor()
    setupRail()
    await updateStatus()
    await runPreloader()

    if (window.gsap) {
      window.gsap.to(preloader, {
        yPercent: -100,
        duration: .9,
        ease: 'power4.inOut',
        onComplete: () => {
          preloader?.remove()
          document.body.classList.remove('loading')
          setupAnimations()
        },
      })
    } else {
      preloader?.remove()
      document.body.classList.remove('loading')
    }
  })
})()
