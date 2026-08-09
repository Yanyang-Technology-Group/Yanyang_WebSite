(function () {
  try {
    var stored = localStorage.getItem('yanyang_theme')
    var theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', theme)
  } catch (e) {}
})()
