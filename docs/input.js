'use strict'

const realWidth = function (elem) {
  return elem.getBoundingClientRect().width
}

const calcRealWidths = function () {
  const lis = document.querySelectorAll('ul[id^="example-"] > li')

  Array.from(lis, li => {
    li.dataset.realWidth = realWidth(li)
  })
}

calcRealWidths()
window.addEventListener('resize', calcRealWidths)
