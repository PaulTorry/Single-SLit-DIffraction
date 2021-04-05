/* global requestAnimationFrame */

import { Vec } from './Vec.js'
import { Grating, Ray, IntensityPattern } from './Model/OpticsClasses.js'
import { drawForground, drawBackground } from './View/drawView.js'

const canvas = document.querySelector('#screen') // ('canvas')
const cx = canvas.getContext('2d')
const fx = document.querySelector('#forground').getContext('2d')
const bx = document.querySelector('#background').getContext('2d')

const sliders = {
  wave: { s: document.getElementById('wavelengthSlide'), t: document.getElementById('wavelengthText') },
  slits: { s: document.getElementById('slitsSlide'), t: document.getElementById('slitsText') },
  slitSeparation: { s: document.getElementById('slitSeparationSlide'), t: document.getElementById('slitSeparationText') },
  slitWidth: { s: document.getElementById('slitWidthSlide'), t: document.getElementById('slitWidthText') }
}
const buttons = {
  record: document.getElementById('rec')
}

const animate = { run: false, notPaused: true }

const pos = { topViewXY: new Vec(1200, 600), grating: { x: 300, dx: 5 }, screen: { x: 900, dx: 4 }, phaseDiagram: new Vec(1000, 700) }
let slit = new Grating(5, 10, 80, pos.screen.x - pos.grating.x)
const wave = { length: 2, phase: 0, amplitude: 20 }
const intensity = new IntensityPattern(pos.topViewXY.y)
let screenDisplacement = pos.topViewXY.y / 2 + 1
let ray = new Ray(slit, screenDisplacement - pos.topViewXY.y / 2, pos.screen.x - pos.grating.x, wave)

const sliderHandlers = {
  wave: (e, v = sliders.wave.s.valueAsNumber) => {
    if (v !== wave.length) { sliders.wave.t.textContent = v; wave.length = v; updateScreen(true) }
  },
  slits: (e, v = sliders.slits.s.valueAsNumber) => {
    if (v !== slit.number) { sliders.slits.t.textContent = v; slit = slit.update(v); ray = ray.updateSlit(slit); updateScreen(true) }
  },
  slitSeparation: (e, v = sliders.slitSeparation.s.valueAsNumber) => {
    if (v !== slit.separation) { sliders.slitSeparation.t.textContent = v; slit = slit.update(undefined, undefined, v); updateScreen(true) }
  },
  slitWidth: (e, v = sliders.slitWidth.s.valueAsNumber) => {
    if (v !== slit.width) { sliders.slitWidth.t.textContent = v; slit = slit.update(undefined, v); updateScreen(true) }
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
      ray = new Ray(slit, screenDisplacement - pos.topViewXY.y / 2, pos.screen.x - pos.grating.x, wave)
      if (animate.run) {
        wave.phase = 0
      } else {
        if (wave.phase > 6) { intensity.addIntensity(ray, screenDisplacement - pos.topViewXY.y / 2) }
      }
    }
    updateScreen()
  }
  buttons.record.addEventListener('click', (e) => {
    intensity.recordIntensites(screenDisplacement, ray)
    updateScreen()
  })
  sliders.wave.s.addEventListener('input', sliderHandlers.wave)
  sliders.slits.s.addEventListener('input', sliderHandlers.slits)
  sliders.slitSeparation.s.addEventListener('input', sliderHandlers.slitSeparation)
  sliders.slitWidth.s.addEventListener('input', sliderHandlers.slitWidth)
  canvas.addEventListener('mousedown', e => { mouseCoords = new Vec(e.offsetX, e.offsetY); animate.notPaused = false })
  canvas.addEventListener('mouseup', e => { mouseCoords = undefined; animate.notPaused = true })
  canvas.addEventListener('dblclick', e => { animate.run = !animate.run })
  canvas.addEventListener('mousemove', (e) => {
    if (mouseCoords) {
      const b = new Vec(e.offsetX, e.offsetY)
      dragEvent(mouseCoords, b)
      mouseCoords = b
    }
  })
}

function drawScreen () {
  cx.clearRect(0, 0, cx.canvas.width, cx.canvas.height)
  cx.drawImage(bx.canvas, 0, 0)
  cx.drawImage(fx.canvas, 0, 0)
}

// function updateScreen () {
//   // updateVars()
//   updateScreen()
// }

// function updateVars () {
//   // ray = new Ray(slit, screenDisplacement - pos.topViewXY.y / 2, pos.screen.x - pos.grating.x, wave)
// }

function updateScreen () {
  drawBackground(bx, intensity.values, pos, wave.amplitude, slit)
  drawForground(fx, slit, ray, wave, pos, screenDisplacement)
  drawScreen()
}

addEventListeners()

function animateIt (time, lastTime) {
  if (lastTime != null & animate.run & animate.notPaused) {
    const prePhase = ray.resultant.phase
    wave.phase += (time - lastTime) * 0.003
    // updateVars()
    if (prePhase > 0 && ray.resultant.phase < 0) {
      intensity.addIntensity(ray)
    }
    updateScreen()
  }
  requestAnimationFrame(newTime => animateIt(newTime, time))
}

requestAnimationFrame(animateIt)
// update()
updateScreen()
