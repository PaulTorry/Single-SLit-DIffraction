/* global
Vec, requestAnimationFrame, arrayFuncs
*/
const colours = (i, o = 1) => {
  const colourArray = [[73, 137, 171], [73, 171, 135], [73, 171, 96], [135, 171, 73], [171, 166, 73], [171, 146, 73]]
  const col = 'rgba(' + colourArray[i][0] + ',' + colourArray[i][1] + ',' + colourArray[i][2] + ',' + o + ')'
  return col
}
const getSinFill = (a, b) => [[a, b - a, 'blue', (a) => Math.max(a, 0)], [a, b - a, 'red', (a) => Math.min(a, 0)]]
const canvas = document.querySelector('#screen') // ('canvas')
const cx = canvas.getContext('2d')
const fx = document.querySelector('#forground').getContext('2d')
const bx = document.querySelector('#background').getContext('2d')
const animate = { run: false, notPaused: true }
const sliders = {
  wave: { s: document.getElementById('wavelengthSlide'), t: document.getElementById('wavelengthText') },
  slits: { s: document.getElementById('slitsSlide'), t: document.getElementById('slitsText') },
  slitSeparation: { s: document.getElementById('slitSeparationSlide'), t: document.getElementById('slitSeparationText') },
  slitWidth: { s: document.getElementById('slitWidthSlide'), t: document.getElementById('slitWidthText') }
}
const buttons = {
  record: document.getElementById('rec')
}
const slit = { number: 5, width: 10, separation: 80, ignoreWidth: false }
const wave = { length: 2, phase: 0, amplitude: 20 }
const pos = { topViewXY: new Vec(1200, 600), grating: { x: 300, dx: 5 }, screen: { x: 900, dx: 4 }, phaseDiagram: new Vec(1000, 700) }
let intensity = Array(pos.topViewXY.y).fill().map((_, i) => [i, 0, []])
const intensityHistory = []

const getGeometry = (screen_d = screenDisplacement) => {
  const d = screenDisplacement - pos.topViewXY.y / 2
  const D = pos.screen.x - pos.grating.x
  const theta = Math.atan((-d) / (pos.screen.x - pos.grating.x))
  const l = Math.sqrt(D * D + d * d)
  const sin = d / l
  const cos = D / l
  const tan = d / D
  return { d, D, theta, l, sin, cos, tan }
}

let screenDisplacement = pos.topViewXY.y / 2
let geo = getGeometry(screenDisplacement)

let slitData = getSlitData()
let resultantData = getResultantData(slitData)
let blocks = makeBlocks()

const sliderHandlers = {
  wave: (e, v = sliders.wave.s.valueAsNumber) => {
    if (v !== wave.length) { sliders.wave.t.textContent = v; wave.length = v; update(true) }
  },
  slits: (e, v = sliders.slits.s.valueAsNumber) => {
    if (v !== slit.number) { sliders.slits.t.textContent = v; slit.number = v; update(true) }
  },
  slitSeparation: (e, v = sliders.slitSeparation.s.valueAsNumber) => {
    if (v !== slit.separation) { sliders.slitSeparation.t.textContent = v; slit.separation = v; update(true) }
  },
  slitWidth: (e, v = sliders.slitWidth.s.valueAsNumber) => {
    if (v !== slit.width) { sliders.slitWidth.t.textContent = v; slit.width = v; update(true) }
  }
}

function addEventListeners () {
  let mouseCoords

  function dragEvent (a, b) {
    const d = b.subtract(a)
    if (d.x * d.x > 16 * d.y * d.y || a.x < pos.grating.x || a.x > pos.screen.x || a.y > pos.topViewXY.y) {
      wave.phase += (d.x) * 0.5 / wave.length
    } else if (16 * d.x * d.x < d.y * d.y) {
      screenDisplacement += d.y
      geo = getGeometry(screenDisplacement)
      if (animate.run) {
        wave.phase = 0
      } else {
        if (wave.phase > 6) { addIntensity(screenDisplacement) }
      }
    }
    update()
  }
  buttons.record.addEventListener('click', (e) => {
    recordIntensites()
    sliderHandlers.wave(e, 10)
  })
  sliders.wave.s.addEventListener('input', sliderHandlers.wave)
  sliders.slits.s.addEventListener('input', sliderHandlers.slits)
  sliders.slitSeparation.s.addEventListener('input', sliderHandlers.slitSeparation)
  sliders.slitWidth.s.addEventListener('input', sliderHandlers.slitWidth)
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

function getSlitData ({ number, width, separation } = slit, { phase, length } = wave, sin = geo.sin) {
  // const firstSlit = pos.topViewXY.y / 2 - ((number - 1) / 2) * (width + separation)
  const firstSlit = pos.topViewXY.y / 2 - ((number - 1) / 2) * (separation)
  const centres = Array(Number.parseInt(number)).fill().map((_, i) => i * (separation)) // + firstSlit)
  const edges = centres.map((v) => [v - width / 2, v + width / 2])
  return { centres, edges, firstSlit }
}

function getResultantData (sd = slitData) {
  return sd.centres.reduce((p, c) => p.add(Vec.fromCircularCoords(1, -wave.phase + c * geo.sin / wave.length + pos.grating.x / wave.length)), new Vec(0, 0))
}

function getIntensityAtDisplacement (d) {
  return getResultantData(getSlitData(slit, wave, getGeometry(d).sin)).mag
}

function makeBlocks ({ centres: c, firstSlit: f } = slitData, w = slit.width, vSize = pos.topViewXY.y) {
  const blocks = [0].concat(c.map((v) => v + f - w / 2)).concat(c.map((v) => v + f + w / 2)).concat([vSize]).sort((a, b) => a - b)
  return blocks.reduce(arrayFuncs.pack2, [])
}

function addIntensity (y) {
  const yInt = Number.parseInt(geo.d)
  if (yInt < pos.topViewXY.y / 2 && yInt > -pos.topViewXY.y / 2) {
    intensity[yInt + pos.topViewXY.y / 2][1] = getIntensityAtDisplacement(geo.d)
  }
}

function recordIntensites () {
  intensityHistory.push(intensity.map((c, i, a) => getIntensityAtDisplacement(i)))
  intensity = intensity.map((c, i, a) => [c[0], 0])
  update()
}

function drawScreen () {
  cx.clearRect(0, 0, cx.canvas.width, cx.canvas.height)
  cx.drawImage(bx.canvas, 0, 0)
  cx.drawImage(fx.canvas, 0, 0)
}

function drawBackground (c = bx) {
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)
  c.fillStyle = 'lightgrey'
  c.strokeStyle = 'black'
  c.strokeRect(0, 0, c.canvas.width, c.canvas.height)
  c.strokeRect(0, 0, ...pos.topViewXY)
  blocks.forEach(([y1, y2], i, a) => {
    c.fillRect(pos.grating.x - pos.grating.dx, y1, pos.grating.dx * 2, y2 - y1)
  })
  c.strokeRect(pos.screen.x, 0, pos.screen.dx, pos.topViewXY.y)

  // intensity pattern
  intensity.forEach((v, i, a) => {
    if (v[1]) {
      drawLine(c, pos.screen.x, v[0], -v[1] * wave.amplitude, 0)
    }
  })
  c.stroke()

  c.moveTo(pos.screen.x, 0)
  intensityHistory.forEach((v, i) => {
    c.beginPath()
    c.strokeStyle = colours(i)
    c.moveTo(0, 0)
    v.forEach((vv, ii) => {
      c.lineTo(-vv * wave.amplitude + pos.screen.x, ii)
    })
    c.stroke()
  })
}

function drawForground (c = fx, sd = slitData, sumOfComponents = resultantData) {
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)

  // line from center of slits to screen
  drawLine(c, pos.grating.x, pos.topViewXY.y / 2, geo.D, geo.d)

  // waves arriving at grating
  newSin(c, wave, 0, sd.firstSlit, pos.grating.x)

  // waves, phasors at slit and at path difference
  let arrowStart = new Vec(0, 0)
  sd.edges.forEach(([yy, yyy], i, a) => {
    const slitTop = new Vec(pos.grating.x, yy + sd.firstSlit)
    const slitBottom = new Vec(pos.grating.x, yyy + sd.firstSlit)
    const phaseAtGrating = -wave.phase + pos.grating.x / wave.length

    // sincurves at angles
    newSin(c, wave, ...slitTop, geo.l / 2, pos.grating.x, 1, geo.theta, colours(i, 0.4))
    newSin(c, wave, ...slitBottom, geo.l / 2, pos.grating.x, 1, geo.theta, colours(i), getSinFill(-yy * geo.sin, -yyy * geo.sin))

    // phasor at grating
    drawLine(c, ...slitTop, ...Vec.unitY.rotate(phaseAtGrating).scale(wave.amplitude))

    // phasor at offset
    const ph = Vec.fromCircularCoords(1, phaseAtGrating + yy * geo.sin / wave.length)

    // on angled sin curve
    drawLine(c, ...slitTop.add(Vec.unitX.rotate(geo.theta).scale(-yy * geo.sin)), ...ph.scale(wave.amplitude))
    // vector at bottom
    drawLine(c, ...pos.phaseDiagram.addXY(-100, i * 40 - slit.number * 20 + 20), ...ph.scale(wave.amplitude), colours(i))
    // vector added to sum
    drawLine(c, ...arrowStart.add(pos.phaseDiagram), ...ph.scale(wave.amplitude), colours(i))
    arrowStart = arrowStart.add(ph.scale(wave.amplitude))
  })

  // bottom wave with areas
  const fills = sd.centres.map((yy, i, a) => [yy * geo.sin, 3, colours(i)])
  newSin(c, wave, 100, pos.topViewXY.y + 100, 600, pos.grating.x, 4, 0, 'black', fills)

  drawLine(c, ...pos.phaseDiagram.addXY(100, 0), ...sumOfComponents.scale(wave.amplitude), 'black')

  // Resultant sin wave and phasor at right
  const newWave = { amplitude: wave.amplitude * sumOfComponents.mag, length: wave.length, phase: sumOfComponents.phase - Math.PI / 2 }
  newSin(c, newWave, pos.screen.x, screenDisplacement, wave.phase * wave.length, 0, 1, 0, 'black')
  drawLine(c, pos.screen.x, screenDisplacement, ...sumOfComponents.scale(wave.amplitude), 'black')
}

function newSin (c, w = wave, startX, startY, length, pd = 0, scale = 1, deflectionAngle = 0, colour = 'black', fill = [[0, 0, 'black']], trigFunc = Math.cos) {
  const dispAtX = (x, rectFunc = (a) => a) => rectFunc(w.amplitude * trigFunc(((x + pd)) / (w.length) - w.phase))
  const pageVec = (x, y) => new Vec(x, y).rotate(deflectionAngle).scale(scale).addXY(startX, startY)
  const plot = (x, dx, rectFunc) => {
    c.beginPath()
    c.moveTo(...pageVec(x, 0))
    for (let dl = x; dl <= x + dx; dl += 1) {
      c.lineTo(...pageVec(dl, dispAtX(dl, rectFunc)))
    }
    c.lineTo(...pageVec(x + dx, 0))
  }
  c.strokeStyle = colour
  plot(0, length / scale)
  c.stroke()

  if (fill) {
    for (const [x, dx, col, func] of fill) {
      c.fillStyle = col
      plot(x, dx, func)
      c.stroke()
      c.fill()
    }
  }
}

function drawLine (c, x1, y1, dx, dy, color) {
  if (color) { c.strokeStyle = color }
  c.beginPath()
  c.moveTo(x1, y1)
  c.lineTo(x1 + dx, y1 + dy)
  c.stroke()
  c.fill()
  c.beginPath()
}

function update () {
  updateVars()
  updateScreen()
}

function updateVars () {
  slitData = getSlitData()
  resultantData = getResultantData()
  blocks = makeBlocks()
}

function updateScreen () {
  drawBackground()
  drawForground()
  drawScreen()
}

// const vec = new Vec(-1, -2)
// console.log(vec, vec.rotate(Math.PI / 2), vec.rotate90(1))

addEventListeners()

function animateIt (time, lastTime) {
  if (lastTime != null & animate.run & animate.notPaused) {
    const prePhase = resultantData.phase
    wave.phase += (time - lastTime) * 0.003
    updateVars()
    if (prePhase > 0 && resultantData.phase < 0) {
      addIntensity()
    }
    updateScreen()
  }
  requestAnimationFrame(newTime => {
    return animateIt(newTime, time)
  })
}
requestAnimationFrame(animateIt)

update()
