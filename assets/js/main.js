window.makeSearchable = makeSearchable
window.lazyLoad = lazyLoad
window.processExternalLinks = processExternalLinks
window.tracked = {}

main()

function main () {
  ;[...document.querySelectorAll('.searchable')].forEach(makeSearchable)
  ;[...document.querySelectorAll('[class*="track-"]')].forEach(trackClick)
  Object.keys(window.localStorage).forEach(key => {
    if (/^track-/.test(key)) {
      window.plausible && window.plausible('clicked ' + key.replace('track-', ''))
      window.localStorage.removeItem(key)
    }
  })

  try { processExternalLinks() } catch (err) { console.error(err.message, err) }

  try { lazyLoad('[lazy]') } catch (err) { console.error(err.message, err) }

  try { makeAnchorTitles() } catch (err) { console.error(err.message, err) }

  if ((window.location.search || '').includes('dark')) {
    trackEvent('used darkmode')
    document.body.classList.add('dark-mode')
    addDarkmodeQueryToInternalLinks()
  }

  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark')
    }
  } catch (err) { console.error(err.message, err) }
}

function trackEvent (name, once = true) {
  if (window.plausible) {
    if (once && !window.tracked[name]) {
      window.tracked[name] = true
      window.plausible(name)
    }
    if (!once) {
      window.plausible(name)
    }
  }
}

function trackClick ($el) {
  if ($el && $el.nodeName === 'A') {
    $el.addEventListener('click', function (e) {
      const trackClass = e.target.getAttribute('class').split(' ').find(c => /^track-.*/.test(c))
      if (trackClass) window.localStorage.setItem(trackClass, 1)
    })
  }
}
function makeSearchable ($searchable) {
  const $search = $searchable.querySelector('input') || document.createElement('input')
  $search.setAttribute('class', 'searchable-input')
  $search.setAttribute('placeholder', 'Search posts... (E.g. "2019", "node", "elixir", "puppeteer", "how to", "mongo")')
  $search.onkeyup = handleSearchKeyUp
  $searchable.parentNode.insertBefore($search, $searchable)

  function handleSearchKeyUp (e) {
    const searchTerm = e.target.value
    const searchRegExp = new RegExp(searchTerm, 'i')
    const $searchableItems = [...($searchable.querySelectorAll('.searchable-item') || [])]
    if ($searchableItems.length > 500) $searchableItems.length = 500

    $searchableItems.forEach(function ($el) {
      const show = !searchTerm || searchRegExp.test($el.innerText)
      if (!show) {
        $el.style.display = 'none'
      } else {
        $el.style.display = 'block'
      }
    })
    trackEvent('used search')
  }
}

function lazyLoad (selector = '[lazy]') {
  let $lazy = typeof selector === 'string' ? [...document.querySelectorAll(selector)] : [...selector]

  $lazy = $lazy.filter(toApplyLazyLoad)

  let lastCheck = Date.now()
  let scrolling = false
  const scrollIntervalHandle = setInterval(() => {
    if (scrolling && lastCheck > Date.now() - 3000) {
      $lazy = $lazy.filter(toApplyLazyLoad)
    } else {
      scrolling = false
    }
    if ($lazy.length === 0) {
      clearInterval(scrollIntervalHandle)
    }
  }, 100)
  document.addEventListener('scroll', registerScrolling, { capture: false, passive: true })
  document.addEventListener('wheel', registerScrolling, { capture: false, passive: true })
  document.addEventListener('touchmove', registerScrolling, { capture: false, passive: true })
  document.addEventListener('touchstart', registerScrolling, { capture: false, passive: true })
  document.addEventListener('touchend', registerScrolling, { capture: false, passive: true })
  const lazyContainers = document.querySelectorAll('.lazy-container')
  if (Array.isArray(lazyContainers) && lazyContainers.length > 0) {
    lazyContainers.addEventListener('scroll', registerScrolling, { capture: false, passive: true })
    lazyContainers.addEventListener('wheel', registerScrolling, { capture: false, passive: true })
    lazyContainers.addEventListener('touchmove', registerScrolling, { capture: false, passive: true })
    lazyContainers.addEventListener('touchstart', registerScrolling, { capture: false, passive: true })
    lazyContainers.addEventListener('touchend', registerScrolling, { capture: false, passive: true })
  }

  function registerScrolling () {
    lastCheck = Date.now()
    scrolling = true
  }

  function toApplyLazyLoad (el) {
    return el && !(isScrolledIntoView(el) && applyLazy(el))
  }

  function applyLazy (el) {
    if (!el) return
    const imageUrl = el.getAttribute('lazy')
    if (el instanceof window.HTMLImageElement) {
      el.setAttribute('src', imageUrl)
    } else {
      el.style.backgroundImage = `url(${imageUrl})`
    }
    return true
  }
}

function isScrolledIntoView (el) {
  if (!el) return
  var rect = el.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + rect.width
  )
}

function makeAnchorTitles () {
  document
    .querySelectorAll('h1:not(.title),h2,h3,h4,h5,h6')
    .forEach(function (heading) {
      if (heading.classList.contains('no-anchor')) return
      if (heading.querySelector('a')) return

      const id = heading.id || (heading.innerText || '').toLowerCase().replace(/ /gi, '-').replace(/[^a-z0-9-]/gi, '')
      heading.id = id
      heading.innerHTML = '<a href="#' + id + '">' + heading.innerText + '</a>'
    })
}

function processExternalLinks () {
  const externalLinks = [...document.querySelectorAll(`body a:not([href~='${window.location.hostname}']):not([href^='/'])`)]
  externalLinks.forEach(el => {
    if (el.getAttribute('href').startsWith('#')) return
    el.setAttribute('target', '_blank')
    !el.getAttribute('rel') && el.setAttribute('rel', 'nofollow external')
  })
}

function addDarkmodeQueryToInternalLinks () {
  const internal = [...document.querySelectorAll(`a[href~='${window.location.hostname}'], a[href^='/']`)]
  internal.forEach(el => el.setAttribute('href', el.getAttribute('href') + '?dark'))
}
