'use strict'

const postcss = require('postcss')

// prefixes:
//   - flex-shrink: 0; flex-grow: 0
// > - flex-shrink: 0; flex-grow: 1 (greedy)
// < - flex-shrink: 1; flex-grow: 0 (easily robbed)
// ~ - flex-shrink: 1; flex-grow: 1 (greedy but easily robbed)
const prefixes = {
  '': [
    { prop: 'flex-grow', value: 0 },
    { prop: 'flex-shrink', value: 1 }
  ],
  '>': [
    { prop: 'flex-grow', value: 1 },
    { prop: 'flex-shrink', value: 0 }
  ],
  '=': [
    { prop: 'flex-grow', value: 0 },
    { prop: 'flex-shrink', value: 0 }
  ],
  '~': [
    { prop: 'flex-grow', value: 1 },
    { prop: 'flex-shrink', value: 1 }
  ]
}

// suffixes:
// ! - overflow: initial (holds their own)
// ? - overflow: hidden (weak af)
const suffixes = {
  '': [],
  '!': [
    { prop: 'overflow', value: 'visible' }
  ],
  '?': [
    { prop: 'overflow', value: 'hidden' }
  ]
}

// regexp for prefix, value and suffix
const chopRegexp = /([~>=]?)(.+)([?!]?)/

// decl is the "sushi-roll: x, y, z" declaration
// decl.parent is the rule that contains the declaration
const sushiRoll = decl => {
  // split the value on commas and trim whitespaces
  const values = decl.value.split(/\s*,\s*/)

  // insert a new rule for each child
  values.forEach((val, idx) => {
    // parse the prefix, value and suffix
    const m = val.match(chopRegexp)
    if (!m) {
      console.warn('Unrecognized input: "%s"', val)
      return
    }

    // get the prefix, flex-basis and suffix
    const prefix = m[1] || ''
    const basis = m[2]
    const suffix = m[3] || ''

    // make the child rule
    let selector = `${decl.parent.selector} > *:nth-child(${idx + 1})`
    if (values.length === 1) {
      selector = `${decl.parent.selector} > *`
    }
    const rule = postcss.rule({
      selector: selector
    })

    // handle the flex-basis
    if (presets.hasOwnProperty(basis)) {
      presets[basis].forEach(prop => {
        rule.append(prop)
      })
    } else {
      rule.append({
        prop: 'flex-basis',
        value: basis
      })
    }

    // handle the prefix
    prefixes[prefix].forEach(prop => {
      rule.append(prop)
    })

    // handle the suffix
    suffixes[suffix].forEach(prop => {
      rule.append(prop)
    })

    // add box-sizing: border-box
    // TODO: make this optional, but enabled by default
    rule.append({
      prop: 'box-sizing',
      value: 'border-box'
    })

    // add the child rule as a sibling of the sushi-roll rule
    decl.parent.parent.append(rule)
  })

  // replace "sushi-roll: foo, bar" with "display: flex"
  decl.replaceWith(postcss.decl({
    prop: 'display',
    value: 'flex'
  }))
}

module.exports = postcss.plugin('postcss-sushi-roll', () => {
  return (root, result) => {
    root.walkDecls('sushi-roll', decl => {
      sushiRoll(decl)
    })
  }
})
