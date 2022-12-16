// -*- js-indent-level: 2 -*-
// Copyright 2022 by zrajm. License: CC BY-SA (text), GPLv2 (code)

// Usage: makeTreeNodes(tree)
//
// Returns HTML structure for the branches (nodes) of a tree diagram. Input
// <tree> is a recursively nested list-of-lists, where first element of each
// list is assumed to be the label for that node/subtree and subsequent list
// items are its child nodes. (I.e. first element should always be string,
// following elements should be either lists [=branch node] or strings [=leaf
// node].)
//
// Example Input
// -------------
//   makeTreeNodes(['NP',
//     ['N', 'tlhIngan'],
//     ['N', 'Hol']
//   ])
//
// Results in the following output
// -------------------------------
//   <node pos="NP">
//     <node pos="N">tlhIngan</node>
//     <node pos="N">Hol</node>
//   </node>
//
function makeTreeNodes(tree) {
  return Array.isArray(tree)
    ? `<node pos="${tree[0]}">${tree.slice(1).map(makeTreeNodes).join('')}</node>`
    : tree
}

// Creates full tree, including caption. Calls makeTreeNodes() internally.
function makeTree(tree, caption) {
  const htmlNodes = makeTreeNodes(tree)
  return `<tree>${htmlNodes}<treecaption>${caption}</treecaption></tree>`
}

// Invoke cb(tag) when elements matching CSS selector <sel> show up on screen.
function onshow(sel, cb) {
  const o = new IntersectionObserver(e => {
    e.filter(e => e.isIntersecting).forEach(e => cb(e.target))
  })
  document.querySelectorAll(sel).forEach(t => o.observe(t))
}

function addLine(t, d, adj) {
  t.insertAdjacentHTML('afterbegin', '<line>')
  const line = t.firstChild
  const [x1, y1] = getCoords(line)
  const [x2, y2] = getCoords(d, adj)
  line.style.height = Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2)) + 'px'
  line.style.transform = `rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI) - 90}deg)`
}

// Returns relative coordinates. (The actual coords are not important as long
// as all coords have the same origin, since we're just going to calculate the
// line length and angle with these).
function getCoords(t, { adjX = 0, adjY = 0 } = {}) {
  const { left, top } = t.getBoundingClientRect()
  return [left + adjX, top + adjY]
}
function drawTreeDiagram(tag) {
  if (tag.classList.contains('drawn')) { return }  // already drawn
  const nodes = tag.querySelectorAll(':scope node')
  // Widen <node>s that aren't wide enough to accomodate its absolutely
  // positioned label. (If label already fits, don't modify the width it
  // because adjustment is actually quite SLOW.)
  nodes.forEach(node => {
    const labelWidth = parseInt(getComputedStyle(node, ':before')['width'])
    if (node.clientWidth < labelWidth) {
      node.style.boxSizing = 'content-box'
      node.style.minWidth = labelWidth + 'px'
    }
  })
  // Add <line>s.
  nodes.forEach(node => {
    const children = node.querySelectorAll(':scope>node')
    node.classList.add(children.length ? 'branch' : 'leaf')
    if (children.length) {  // branch node node
      children.forEach(child => {
        addLine(node, child, { adjX: child.offsetWidth / 2 })
      })
    } else {                // leaf node
      const nodeStyle = getComputedStyle(node)
      const adj = parseInt(getComputedStyle(node, ':before')['height']) +
        parseInt(nodeStyle['border-bottom-width']) +
        parseInt(nodeStyle['padding-bottom'])
      addLine(node, node, {
        adjX: node.offsetWidth / 2,
        adjY: node.offsetHeight - adj,
      })
    }
  })
  tag.classList.add('drawn');
}

addEventListener('load', () => {
  // Watch all <tree> tags, draw each tree when it become visible.
  onshow('tree', drawTreeDiagram)
})

/*[eof]*/
