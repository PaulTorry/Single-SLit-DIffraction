/* global
Vec, requestAnimationFrame
*/
const colours = ['#4989ab', '#49ab87', '#49ab60', '#87ab49', '#aba649', '#ab9249']
const canvas = document.querySelector('canvas')
const cx = canvas.getContext('2d')
const animate = { run: false, notPaused: true }
const sliders = {
  wave: { s: document.getElementById('wavelengthSlide'), t: document.getElementById('wavelengthText') },
  slits: { s: document.getElementById('slitsSlide'), t: document.getElementById('slitsText') }
}

const slit = { number: 5, width: 5, separation: 60 }
const wave = { length: 2, phase: 0, amplitude: 15 }
const pos = { topViewXY: new Vec(1200, 600), grating: { x: 300, dx: 5 }, screen: { x: 900, dx: 4 }, phaseDiagram: new Vec(1000, 700) }

let centers = findSlitCenters()
let blocks = makeBlocks()
let theta = 0

function addEventListeners () {
  let mouseCoords

  function dragEvent (a, b) {
    console.log(theta)
    const d = b.subtract(a)
    if (d.x * d.x > 16 * d.y * d.y || a.x < pos.grating.x || a.x > pos.screen.x || a.y > pos.topViewXY.y) {
      wave.phase += (d.x) * 1 / wave.length
    } else if (16 * d.x * d.x < d.y * d.y) {
      theta -= d.y * 1 / pos.topViewXY.y
    }
    //console.log(theta)
   // console.log()
    update()
  }

  sliders.wave.s.addEventListener('mousemove', (e) => {
    const value = sliders.wave.s.value
    if (value !== wave.length) { sliders.wave.t.textContent = value; wave.length = value; update(true) }
  })
  sliders.slits.s.addEventListener('mousemove', (e) => {
    const value = sliders.slits.s.value
    if (value !== slit.number) { sliders.slits.t.textContent = value; slit.number = value; update(true) }
  })
  canvas.addEventListener('mousedown', function (e) { mouseCoords = new Vec(e.offsetX, e.offsetY); animate.notPaused = false })
  canvas.addEventListener('mouseup', function (e) { mouseCoords = undefined; animate.notPaused = true })
  canvas.addEventListener('dblclick', function (e) { animate.run = !animate.run })
  canvas.addEventListener('mousemove', (e) => {
    if (mouseCoords) {
      const b = new Vec(e.offsetX, e.offsetY)
      dragEvent(mouseCoords, b)
      mouseCoords = b
    }
  })
}

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
  drawLine(pos.grating.x, pos.topViewXY.y / 2, pos.screen.x, pos.topViewXY.y / 2 + (pos.screen.x - pos.grating.x + pos.grating.dx) * -Math.tan(theta))

  newSin(0, centers[0], pos.grating.x)

  centers.forEach((c, i, a) => {
    const xx = pos.grating.x + pos.grating.dx
    const ll = (pos.screen.x - xx) / Math.cos(theta) * 0.5
    const yy = c
    const col = colours[i]
    const fillOff = Math.sin(theta) * (c - a[0])
    newSin(xx, yy, ll, xx, wave, 1, theta, col, [[fillOff, 3, 'blue', (a) => Math.max(a, 0)], [fillOff, 3, 'red', (a) => Math.min(a, 0)]])
    drawLine(xx, yy, ...Vec.fromCircularCoords(20, -wave.phase + xx / wave.length).addXY(xx, yy))
  })

  const offsets = centers.map((c, i, a) => Math.sin(theta) * (c - a[0]))
  const fills = offsets.map((c, i, a) => [c, 3, colours[i]])
  newSin(100, pos.topViewXY.y + 100, 600, pos.grating.x + pos.grating.dx, wave, 4, 0, 'black', fills)

  offsets.map((c) => Vec.fromCircularCoords(20, -wave.phase + (c + pos.grating.x + pos.grating.dx) / wave.length))
    .reduce((p, c, i, a) => {
      //console.log(p, c, i, a)
      return p.concat([[p[i][1], p[i][1].add(c)]])
    }, [[new Vec(0, 0), new Vec(0, 0)]])
    .forEach((c, i, a) => {
      drawLine(...c[0].add(pos.phaseDiagram), ...c[1].add(pos.phaseDiagram), colours[i])
    })

  // console.log(centers)

  const getTrigFunction = (centers) => (x) => centers.map((v, i, a) => Math.cos(x + ((v - a[0]) * Math.sin(theta)) / wave.length)).reduce((p, vv) => p + vv)
  const trigF = getTrigFunction(centers)

  newSin(pos.screen.x + pos.screen.dx, pos.topViewXY.y / 2 - (pos.screen.x - pos.grating.x) * Math.tan(theta), 200, pos.grating.x + pos.grating.dx, wave, 1, 0, 'black', undefined, trigF)
  // for (let iii = 0; iii < 300; iii++) {
  //   console.log(trigF(iii / 100))              - (pos.screen - pos.grating) * 0 * Math.tan(theta)
  // }
}

function clearBackGround (color = 'white') {
  cx.fillStyle = color
  cx.fillRect(0, 0, cx.canvas.width, cx.canvas.height)
}

function newSin (startX, startY, length, pd = 0, w = wave, scale = 1, deflectionAngle = 0, colour = 'black', fill = [[0, 0, 'black']], trigFunc = Math.cos) {
  const dispAtX = (x, rectFunc = (a) => a) => rectFunc(w.amplitude * trigFunc(((x + pd)) / (w.length) - w.phase))
  const pageVec = (x, y) => new Vec(x, y).rotate(deflectionAngle).scale(scale).addXY(startX, startY)
  const plot = (x, dx, rectFunc) => {
    cx.beginPath()
    cx.moveTo(...pageVec(x, 0))
    for (let dl = x; dl <= x + dx; dl += 1) {
      cx.lineTo(...pageVec(dl, dispAtX(dl, rectFunc)))
    }
    cx.lineTo(...pageVec(x + dx, 0))
  }

  cx.strokeStyle = colour
  plot(0, length / scale)
  cx.stroke()

  if (fill) {
    for (const [x, dx, col, func] of fill) {
      cx.fillStyle = col
      plot(x, dx, func)
      cx.fill()
    }
  }
}

function drawLine (x1, y1, x2, y2, color) {
  if (color) { cx.strokeStyle = color }
  cx.beginPath()
  cx.moveTo(x1, y1)
  cx.lineTo(x2, y2)
  cx.stroke()
}

function update () {
  centers = findSlitCenters()
  blocks = makeBlocks()
  clearBackGround()
  drawBackground()
  drawForground()
}

addEventListeners()

function animateIt (time, lastTime) {
  if (lastTime != null & animate.run & animate.notPaused) {
    wave.phase += (time - lastTime) * 0.003
  }
  update()
  requestAnimationFrame(newTime => {
    return animateIt(newTime, time)
  })
}
requestAnimationFrame (animateIt)

console.log(Vec.fromCircularCoords(5, 0))
console.log(Vec.fromCircularCoords(5, 0).toCircularCoords())

update()
