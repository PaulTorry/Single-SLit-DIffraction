/* global requestAnimationFrame */

import { Vec } from './Vec.js'
import { Grating, Ray, IntensityPattern } from './Model/OpticsClasses.js'
import { drawForground, drawBackground } from './View/drawView.js'

const canvas = document.querySelector('#screen')
const cx = canvas.getContext('2d')
const fx = document.querySelector('#forground').getContext('2d')
const bx = document.querySelector('#background').getContext('2d')

const sliders = {
  wave: { s: document.getElementById('wavelengthSlide'), t: document.getElementById('wavelengthText') },
  slits: { s: document.getElementById('slitsSlide'), t: document.getElementById('slitsText') },
  slitSeparation: { s: document.getElementById('slitSeparationSlide'), t: document.getElementById('slitSeparationText') },
  slitWidth: { s: document.getElementById('slitWidthSlide'), t: document.getElementById('slitWidthText') }
}
const checkboxes = {
  animate: document.getElementById('anim'),
  record: document.getElementById('rec')
}
const buttons = {
  record: document.getElementById('hist')
}

const settings = { animate: { run: false, notPaused: true }, record: false }
const pos = { topViewXY: new Vec(1200, 600), grating: { x: 300, dx: 5 }, screen: { x: 900, dx: 4 }, phaseDiagram: new Vec(1000, 700) }

let slit = new Grating(5, 10, 80)
const wave = { length: 2, phase: 0, amplitude: 20 }
let displacement = 1
let ray = new Ray(slit, displacement, pos.screen.x - pos.grating.x, wave)

const intensity = new IntensityPattern(pos.topViewXY.y)

addEventListeners()
requestAnimationFrame(animateIt)
update()

function addEventListeners () {
  let mouseCoords

  function dragEvent (a, b) {
    const d = b.subtract(a)
    if (d.x * d.x > 16 * d.y * d.y || a.x < pos.grating.x || a.x > pos.screen.x || a.y > pos.topViewXY.y) {
      wave.phase += (d.x) * 0.5 / wave.length
    } else if (16 * d.x * d.x < d.y * d.y) {
      displacement += d.y
      if (settings.record) { intensity.addIntensity(ray) }
      if (settings.animate.run && !settings.record) { wave.phase = 0 }
    }
    update()
  }
  buttons.record.addEventListener('click', (e) => {
    intensity.recordIntensites()
    update()
  })
  sliders.wave.s.addEventListener('input', (e, v = sliders.wave.s.valueAsNumber) => {
    if (v !== wave.length) { sliders.wave.t.textContent = v; wave.length = v; update(true); intensity.staleintensities() }
  })
  sliders.slits.s.addEventListener('input', (e, v = sliders.slits.s.valueAsNumber) => {
    if (v !== slit.number) { sliders.slits.t.textContent = v; slit = slit.update(v); update(true) }
  })
  sliders.slitSeparation.s.addEventListener('input', (e, v = sliders.slitSeparation.s.valueAsNumber) => {
    if (v !== slit.separation) { sliders.slitSeparation.t.textContent = v; slit = slit.update(undefined, undefined, v); update(true) }
  })
  sliders.slitWidth.s.addEventListener('input', (e, v = sliders.slitWidth.s.valueAsNumber) => {
    if (v !== slit.width) { sliders.slitWidth.t.textContent = v; slit = slit.update(undefined, v); update(true) }
  })

  checkboxes.animate.addEventListener('change', (e) => {
    // console.log(checkboxes.animate)
    settings.animate.run = checkboxes.animate.checked
  })
  checkboxes.record.addEventListener('change', (e) => {
    // console.log(checkboxes.animate)
    settings.record = checkboxes.record.checked
  })
  canvas.addEventListener('mousedown', e => { mouseCoords = new Vec(e.offsetX, e.offsetY); settings.animate.notPaused = false })
  canvas.addEventListener('mouseup', e => { mouseCoords = undefined; settings.animate.notPaused = true })
  canvas.addEventListener('dblclick', e => {
    settings.animate.run = !settings.animate.run
    checkboxes.animate.checked = settings.animate.run
  })
  canvas.addEventListener('click', e => {
    if (e.detail === 3) {
      settings.record = !settings.record
      checkboxes.record.checked = settings.record
      settings.animate.run = false
      checkboxes.animate.checked = false
    }
  })
  canvas.addEventListener('mousemove', (e) => {
    if (mouseCoords) {
      const b = new Vec(e.offsetX, e.offsetY)
      dragEvent(mouseCoords, b)
      mouseCoords = b
    }
  })
}

function update () {
  ray = new Ray(slit, displacement, pos.screen.x - pos.grating.x, wave)
  drawBackground(bx, intensity.values, pos, wave.amplitude, slit)
  drawForground(fx, slit, ray, wave, pos)
  cx.clearRect(0, 0, cx.canvas.width, cx.canvas.height)
  cx.drawImage(bx.canvas, 0, 0)
  cx.drawImage(fx.canvas, 0, 0)
}

function animateIt (time, lastTime) {
  if (lastTime != null & settings.animate.run & settings.animate.notPaused) {
    const prePhase = ray.resultant.phase
    wave.phase += (time - lastTime) * 0.003
    // ray = ray.updatePhase(wave.phase)
    if (prePhase > 0 && ray.resultant.phase < 0) {
      intensity.addIntensity(ray)
    }
    update()
  }
  requestAnimationFrame(newTime => animateIt(newTime, time))
}
