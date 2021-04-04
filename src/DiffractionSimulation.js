/* global requestAnimationFrame */

import { Vec } from './Vec.js'
import { Grating, Ray } from './Model/OpticsClasses.js'
import { drawForground, drawBackground } from './View/drawView.js'

// console.log('Vec.unitX')


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

const pos = { topViewXY: new Vec(1200, 600), grating: { x: 300, dx: 5 }, screen: { x: 900, dx: 4 }, phaseDiagram: new Vec(1000, 700) }
let slit = new Grating(5, 10, 80, pos.screen.x - pos.grating.x)
const wave = { length: 2, phase: 0, amplitude: 20 }

const intensity = Array(4).fill(0).map(c => Array(pos.topViewXY.y).fill(0))

let screenDisplacement = pos.topViewXY.y / 2 + 1
let blocks = makeBlocks()
let ray = new Ray(slit, screenDisplacement - pos.topViewXY.y / 2, pos.screen.x - pos.grating.x, wave)

const sliderHandlers = {
  wave: (e, v = sliders.wave.s.valueAsNumber) => {
    if (v !== wave.length) { sliders.wave.t.textContent = v; wave.length = v; update(true) }
  },
  slits: (e, v = sliders.slits.s.valueAsNumber) => {
    if (v !== slit.number) { sliders.slits.t.textContent = v; slit = slit.update(v); update(true) }
  },
  slitSeparation: (e, v = sliders.slitSeparation.s.valueAsNumber) => {
    if (v !== slit.separation) { sliders.slitSeparation.t.textContent = v; slit = slit.update(undefined, undefined, v); update(true) }
  },
  slitWidth: (e, v = sliders.slitWidth.s.valueAsNumber) => {
    if (v !== slit.width) { sliders.slitWidth.t.textContent = v; slit = slit.update(undefined, v); update(true) }
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

function makeBlocks ({ centres: c, firstSlit: f } = slit, w = slit.width, vSize = pos.topViewXY.y) {
  const blocks = [0].concat(c.map((v) => v + f - w / 2)).concat(c.map((v) => v + f + w / 2)).concat([vSize]).sort((a, b) => a - b)
  return blocks.reduce((ac, cv, i, ar) => i % 2 ? ac.concat([[ar[i - 1], ar[i]]]) : ac, [])
}

function addIntensity (screenD = screenDisplacement) {
  for (let i = screenD - 4; i <= screenD + 4; i++) {
    if (i > 0 && i < pos.topViewXY.y) {
      const thisRay = ray.getRay(i - pos.topViewXY.y / 2)
      intensity[0][i] = thisRay.resultant.mag
      intensity[1][i] = thisRay.singleSlitModulation
      intensity[2][i] = thisRay.resultant.mag * thisRay.singleSlitModulation
    }
  }
}

function recordIntensites () {
  console.log('intensity recorded')
  intensity[3] = intensity[2].map(a => a)
  update()
}

function drawScreen () {
  cx.clearRect(0, 0, cx.canvas.width, cx.canvas.height)
  cx.drawImage(bx.canvas, 0, 0)
  cx.drawImage(fx.canvas, 0, 0)
}

function update () {
  updateVars()
  updateScreen()
}

function updateVars () {
  ray = new Ray(slit, screenDisplacement - pos.topViewXY.y / 2, pos.screen.x - pos.grating.x, wave)
  blocks = makeBlocks()
}

function updateScreen () {
  // (c, intensity, pos, amplitude, blocks)
  drawBackground(bx, intensity, pos, wave.amplitude, blocks)
  drawForground(fx, slit, ray, wave, pos, slit, screenDisplacement)
  drawScreen()
}

addEventListeners()

function animateIt (time, lastTime) {
  if (lastTime != null & animate.run & animate.notPaused) {
    const prePhase = ray.resultant.phase
    wave.phase += (time - lastTime) * 0.003
    updateVars()
    if (prePhase > 0 && ray.resultant.phase < 0) {
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
