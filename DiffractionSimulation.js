/* global
Vec
*/
const colours = ['#4989ab', '#49ab87', '#49ab60', '#87ab49', '#aba649', '#ab9249']
const canvas = document.querySelector('canvas')
const cx = canvas.getContext('2d')
const sliders = {
  wave: { s: document.getElementById('wavelengthSlide'), t: document.getElementById('wavelengthText') },
  slits: { s: document.getElementById('slitsSlide'), t: document.getElementById('slitsText') }
}
function addEventListeners () {
  sliders.wave.s.addEventListener('mousemove', (e) => {
    const value = sliders.wave.s.value
    if (value !== wave.length) { sliders.wave.t.textContent = value; wave.length = value; update(true) }
  })
  sliders.slits.s.addEventListener('mousemove', (e) => {
    const value = sliders.slits.s.value
    if (value !== slit.number) { sliders.slits.t.textContent = value; slit.number = value; update(true) }
  })

  canvas.addEventListener('mousedown', function (e) { mouseCoords = new Vec(e.offsetX, e.offsetY) })
  canvas.addEventListener('mouseup', function (e) { mouseCoords = undefined })
  canvas.addEventListener('mousemove', (e) => {
    if (mouseCoords) {
   //   console.log(mouseCoords)
      const b = new Vec(e.offsetX, e.offsetY)
      dragEvent(mouseCoords, b)
      mouseCoords = b
    }
  })
}

function dragEvent (a, b) {
  const d = b.subtract(a)
  if (d.x * d.x > d.y * d.y || a.x < pos.grating.x || a.x > pos.screen.x) {
    wave.phase += (d.x) * 1 / wave.length
  } else { theta -= d.y / pos.topViewXY.y }
  update()
}

var mouseCoords
const slit = { number: 5, width: 5, separation: 40 }
const wave = { length: 5, phase: 0, amplitude: 10 }
const pos = { topViewXY: new Vec(800, 400), grating: { x: 200, dx: 5 }, screen: { x: 600, dx: 4 } }

// const makeBlocks = (centers, w, vSize) => [0].concat(centers.map((v) => v - w / 2)).concat(centers.map((v) => v + w / 2)).concat([vSize]).sort((a, b) => a - b)
// const pack2 = (ac, cv, ix, arr) => ix % 2 ? ac.concat([[arr[ix - 1], arr[ix]]]) : ac

let centers = findSlitCenters()
let blocks = makeBlocks()
let theta = 0

//console.log(centers, blocks)

function findSlitCenters (n = slit.number, w = slit.width, s = slit.separation, vSize = pos.topViewXY.y) {
  const offset = ((n - 1) / 2) * (w + s)
  return Array(Number.parseInt(n)).fill().map((_, i) => i * (w + s) - offset + vSize / 2)
}

function makeBlocks (c = centers, w = slit.width, vSize = pos.topViewXY.y) {
  const pack2 = (ac, cv, ix, arr) => ix % 2 ? ac.concat([[arr[ix - 1], arr[ix]]]) : ac
  const blocks = [0].concat(c.map((v) => v - w / 2)).concat(c.map((v) => v + w / 2)).concat([vSize]).sort((a, b) => a - b)
  return blocks.reduce(pack2, [])
}

function drawBackground () {
  cx.fillStyle = 'black'
  cx.strokeStyle = 'black'
  cx.strokeRect(0, 0, cx.canvas.width, cx.canvas.height)
  cx.strokeRect(0, 0, ...pos.topViewXY)
  blocks.forEach(([y1, y2], i, a) => {
    cx.strokeRect(pos.grating.x, y1, pos.grating.dx, y2 - y1)
  })
  cx.strokeRect(pos.screen.x, 0, pos.screen.dx, pos.topViewXY.y)

  cx.stroke()
}

function drawForground () {
  newSin(new Vec(0, centers[0]), pos.grating.x)

  centers.forEach((c, i, a) => {

    const xx = pos.grating.x + pos.grating.dx
    const ll = (pos.screen.x - xx) / Math.cos(theta) * 0.5
    const yy = c
    const col = colours[i]
    const fillOff = Math.sin(theta) * (c - a[0])
    newSin(new Vec(xx, yy), ll, xx, wave, 1, theta, col, [[fillOff, 3, 'blue', (a) => Math.max(a, 0)], [fillOff, 3, 'red', (a) => Math.min(a, 0)]])
  })

  let offsets = centers.map((c, i, a) => Math.sin(theta) * (c - a[0]))
  let fills = offsets.map((c, i, a) => [c, 3, colours[i]])
  // newSin(new Vec(xx, yy), ll, xx, wave, 1, theta, col, [[fillOff, 3, 'blue', (a) => Math.max(a, 0)], [fillOff, 3, 'red', (a) => Math.min(a, 0)]])
}

function clearBackGround (color = 'white') {
  cx.fillStyle = color
  cx.fillRect(0, 0, cx.canvas.width, cx.canvas.height)
}

function newSin (startPos, length, pd = 0, w = wave, scale = 1, deflectionAngle = 0, colour = 'black', fill = [[0, 0, 'black']]) {
  const dispAtX = (x, func = (a) => a) => func(scale * w.amplitude * Math.sin(((x + pd) / scale) / (w.length) - w.phase))
  const pageVec = (x, y) => new Vec(x, y).rotate(deflectionAngle).add(startPos)
  const plot = (x, dx, func) => {
    cx.beginPath()
    cx.moveTo(...pageVec(x, 0))
    for (let dl = x; dl <= x + dx; dl += 1) {
      cx.lineTo(...pageVec(dl, dispAtX(dl, func)))
    }
    cx.lineTo(...pageVec(x + dx, 0))
  }

  cx.strokeStyle = colour
  plot(0, length)
  cx.stroke()

 // console.log("fsesf");

  if (fill) {
//    console.log("sfwef");
    for (const [x, dx, col, func] of fill) {
      console.log(fill)
      cx.fillStyle = col
      plot(x, dx, func)
      cx.fill()
    }
  }
}

function update () {
  centers = findSlitCenters()
  blocks = makeBlocks()
  clearBackGround()
  drawBackground()
  drawForground()
}

addEventListeners()
update()
