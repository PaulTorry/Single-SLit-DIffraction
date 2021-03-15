/* global
Vec, requestAnimationFrame, arrayFuncs
*/
const colours = ['#4989ab', '#49ab87', '#49ab60', '#87ab49', '#aba649', '#ab9249']
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
const slit = { number: 5, width: 10, separation: 80 }
const wave = { length: 2, phase: 0, amplitude: 20 }
const pos = { topViewXY: new Vec(1200, 600), grating: { x: 300, dx: 5 }, screen: { x: 900, dx: 4 }, phaseDiagram: new Vec(1000, 700) }
let intensity = Array(pos.topViewXY.y).fill().map((_, i) => [i, 0, []])
const intensityHistory = []

let theta = 0
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
    // console.log(theta)
    const d = b.subtract(a)
    if (d.x * d.x > 16 * d.y * d.y || a.x < pos.grating.x || a.x > pos.screen.x || a.y > pos.topViewXY.y) {
      wave.phase += (d.x) * 0.5 / wave.length
    } else if (16 * d.x * d.x < d.y * d.y) {
      theta -= d.y * 1 / pos.topViewXY.y
      if (animate.run) {
        wave.phase = 0
      } else {
        if (wave.phase > 6) { addIntensity() }
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

function getSlitData (n = slit.number, w = slit.width, s = slit.separation, vSize = pos.topViewXY.y) {
  const offset = ((n - 1) / 2) * (w + s)
  const centres = Array(Number.parseInt(n)).fill().map((_, i) => i * (w + s) - offset + vSize / 2)
  const offsets = centres.map((yy, i, a) => Math.sin(theta) * (yy - a[0]))
  const vectors = offsets.map((c) => Vec.fromCircularCoords(1, -wave.phase + (c + pos.grating.x) / wave.length))
  return arrayFuncs.zip([centres, offsets, vectors])
}

function getResultantData (sd = slitData) {
  const beamLength = (pos.screen.x - pos.grating.x) / Math.cos(theta) * 0.5
  const displacement = pos.topViewXY.y / 2 - (pos.screen.x - pos.grating.x) * Math.tan(theta)
  const sumOfComponents = sd.reduce((p, [,, v]) => p.add(v), new Vec(0, 0))
  return { beamLength, displacement, sumOfComponents }
}

function getIntensityAtDisplacement (displacement, centres = slitData.map(c => c[0])) {
  // console.log(centres);
  // console.log(displacement - pos.topViewXY.y / 2, (pos.screen.x - pos.grating.x));
  const angle = Math.atan((-displacement + pos.topViewXY.y / 2) / (pos.screen.x - pos.grating.x))
  // console.log("angle", angle, theta);
  const offsets = centres.map((yy, i, a) => Math.sin(angle) * (yy - a[0]))
  // console.log(offsets);
  const vectors = offsets.map((c) => Vec.fromCircularCoords(1, -wave.phase + (c + pos.grating.x) / wave.length))
  // console.log(vectors);
  const sumOfComponents = vectors.reduce((p, v) => p.add(v), new Vec(0, 0))
  // console.log(sumOfComponents);
  return sumOfComponents.mag
}

function makeBlocks (s = slitData, w = slit.width, vSize = pos.topViewXY.y) {
  const c = slitData.map((c) => c[0])
  const blocks = [0].concat(c.map((v) => v - w / 2)).concat(c.map((v) => v + w / 2)).concat([vSize]).sort((a, b) => a - b)
  return blocks.reduce(arrayFuncs.pack2, [])
}
function addIntensity (y) {
  const yInt = Number.parseInt(resultantData.displacement)

  // console.log(resultantData.sumOfComponents.mag - getIntensityAtDisplacement(yInt), resultantData.sumOfComponents.mag, getIntensityAtDisplacement(yInt))

  if (yInt < pos.topViewXY.y && yInt > 0) {
    intensity[Number.parseInt(resultantData.displacement)][1] = resultantData.sumOfComponents.mag
  }
}

function recordIntensites () {
  // console.log(intensity)
  intensityHistory.push(intensity.map((c, i, a) => getIntensityAtDisplacement(i)))
  intensity = intensity.map((c, i, a) => [c[0], 0])
  console.log(intensityHistory)
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
    // console.log(v)
    if (v[1]) {
      // console.log(v)
      drawLine(c, pos.screen.x, v[0], -v[1] * wave.amplitude, 0)
    }
  })
  c.stroke()

  c.moveTo(pos.screen.x, 0)
  intensityHistory.forEach((v, i) => {
    c.beginPath()
    c.strokeStyle = colours[i]
    c.moveTo(0, 0)
    v.forEach((vv, ii) => {
      c.lineTo(-vv * wave.amplitude + pos.screen.x, ii)
    })
    c.stroke()
  })
}

function drawForground (c = fx, sd = slitData, rd = resultantData) {
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)
  const capitalD = (pos.screen.x - pos.grating.x)

  // line from center of slits to screen
  drawLine(c, pos.grating.x, pos.topViewXY.y / 2, capitalD, capitalD * -Math.tan(theta))

  // waves arriving at grating
  newSin(c, wave, 0, sd[0][0], pos.grating.x)

  // waves, phasors at slit and at path difference
  sd.forEach(([yy, off, v], i, a) => {
    const col = colours[i]
    newSin(c, wave, pos.grating.x, yy, rd.beamLength, pos.grating.x, 1, theta, col, [[off - 2, 3, 'blue', (a) => Math.max(a, 0)], [off, 3, 'red', (a) => Math.min(a, 0)]])
    drawLine(c, pos.grating.x, yy, ...Vec.fromCircularCoords(1, -wave.phase + pos.grating.x / wave.length).scale(wave.amplitude))
    drawLine(c, pos.grating.x + off * Math.cos(theta), yy - off * Math.sin(theta), ...v.scale(wave.amplitude))
  })

  // bottom wave with areas
  const fills = sd.map(([_, off], i, a) => [off, 3, colours[i]])
  newSin(c, wave, 100, pos.topViewXY.y + 100, 600, pos.grating.x, 4, 0, 'black', fills)

  // sum of phasors
  let arrowStart = new Vec(0, 0)
  for (const i in sd) {
    drawLine(c, ...pos.phaseDiagram.addXY(-100, i * 40 - slit.number * 20 + 20), ...sd[i][2].scale(wave.amplitude), colours[i])
    drawLine(c, ...arrowStart.add(pos.phaseDiagram), ...sd[i][2].scale(wave.amplitude), colours[i])
    arrowStart = arrowStart.add(sd[i][2].scale(wave.amplitude))
  }
  drawLine(c, ...pos.phaseDiagram.addXY(100, 0), ...rd.sumOfComponents.scale(wave.amplitude), 'black')

  // Resultant sin wave and phasor
  const newWave = { amplitude: wave.amplitude * rd.sumOfComponents.toCircularCoords().r, length: wave.length, phase: rd.sumOfComponents.toCircularCoords().theta - Math.PI / 2 }
  newSin(c, newWave, pos.screen.x, rd.displacement, wave.phase * wave.length, 0, 1, 0, 'black')
  drawLine(c, pos.screen.x, rd.displacement, ...rd.sumOfComponents.scale(wave.amplitude), 'black')
}

function clearCanvas (c = cx, color = 'white') {
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)
  // c.beginPath()
  // c.fillStyle = color
  // c.fillRect(0, 0, c.canvas.width, c.canvas.height)
  // c.stroke()
  // c.fill()
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
  // clearCanvas(cx)
  drawBackground()
  drawForground()
  drawScreen()
}

addEventListeners()

function animateIt (time, lastTime) {
  if (lastTime != null & animate.run & animate.notPaused) {
    const prePhase = resultantData.sumOfComponents.phase
    wave.phase += (time - lastTime) * 0.003
    updateVars()
    if (prePhase > 0 && resultantData.sumOfComponents.phase < 0) {
    //  console.log('fwefwef')
      addIntensity()
    }
    updateScreen()
  }
  requestAnimationFrame(newTime => {
    return animateIt(newTime, time)
  })
}
requestAnimationFrame(animateIt)

// console.log(Vec.fromCircularCoords(5, 0))
// console.log(Vec.fromCircularCoords(5, 0).toCircularCoords())

update()
