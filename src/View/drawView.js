import { Vec } from '../Vec.js'
import { drawLine, drawTrace, newSin } from './drawFunctions.js'

const colours = (i, o = 1) => {
  const colourArray = [[73, 137, 171], [73, 171, 135], [73, 171, 96], [135, 171, 73], [171, 166, 73], [171, 146, 73]]
  const col = 'rgba(' + colourArray[i][0] + ',' + colourArray[i][1] + ',' + colourArray[i][2] + ',' + o + ')'
  return col
}
const getSinFill = (a, b) => [[a, b - a, 'blue', (a) => Math.max(a, 0)], [a, b - a, 'red', (a) => Math.min(a, 0)]]

// Draw foreground

function drawForground (c, slit, ray, wave, pos, screenDisplacement) {
  const geo = ray.geo
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)

  // line from center of slits to screen
  drawLine(c, pos.grating.x, pos.topViewXY.y / 2, geo.D, geo.d)

  // waves arriving at grating
  newSin(c, wave, pos.grating.x, slit.firstSlit + pos.topViewXY.y / 2, [-pos.grating.x, pos.grating.x])

  // waves, phasors at slit and at path difference
  let arrowStart = new Vec(0, 0)

  ray.zipped.forEach(({ e: [top, bot], ep: [ph1, ph2], integral, posPonB: [p1, p2] }, i, a) => {
    const slitTop = new Vec(pos.grating.x, top + slit.firstSlit + pos.topViewXY.y / 2)
    const slitBottom = new Vec(pos.grating.x, bot + slit.firstSlit + pos.topViewXY.y / 2)

    // sincurves at angles
    newSin(c, wave, ...slitTop, [0, geo.l / 2], 0, 1, geo.theta, colours(i, 0.4))
    newSin(c, wave, ...slitBottom, [0, geo.l / 2], 0, 1, geo.theta, colours(i), getSinFill(-top * geo.sin, -bot * geo.sin))

    // phasor at grating
    drawLine(c, ...slitTop, ...Vec.unitY.scale(wave.amplitude))

    // on angled sin curve
    drawLine(c, ...slitTop.add(p1), ...ph1.scale(wave.amplitude))
    drawLine(c, ...slitBottom.add(p2), ...ph2.scale(wave.amplitude))
    // vector at bottom
    drawLine(c, ...pos.phaseDiagram.addXY(-100, i * 40 - slit.number * 20 + 20), ...integral.scale(wave.amplitude), colours(i))
    // vector added to sum
    drawLine(c, ...arrowStart.add(pos.phaseDiagram), ...integral.scale(wave.amplitude), colours(i))
    arrowStart = arrowStart.add(integral.scale(wave.amplitude))

    // const integralPh = ph.integrateTo(ph2).scale(5 / (slit.width * geo.sin))
    drawLine(c, ...pos.phaseDiagram.addXY(-100, i * 40 - slit.number * 20 + 20), ...integral.scale(wave.amplitude), colours(i))
  })

  // bottom wave with areas
  // const fills = sd.centres.map((yy, i, a) => [yy * geo.sin, 3, colours(i)])

  const fills = slit.edges.map(([yy, yyy], i, a) => [-yy * geo.sin, -yyy * geo.sin + yy * geo.sin, colours(i)])

  // newSin(c, wave, 100, pos.topViewXY.y + 300, [0, 600], pos.grating.x, 1, 0, 'black', fills)
  newSin(c, wave, 300, 700, [-150, 700], 0, 4, 0, 'black', fills)
  drawLine(c, 300, 600, 0, 200, 'black')

  const finalPhasor = ray.resultant.scale(wave.amplitude * ray.singleSlitModulation)
  drawLine(c, ...pos.phaseDiagram.addXY(100, 0), ...finalPhasor, 'black')

  // Resultant sin wave and phasor at right
  const newWave2 = { amplitude: wave.amplitude * ray.resultant.mag * ray.singleSlitModulation, length: wave.length, phase: ray.resultant.phase - Math.PI / 2 }
  newSin(c, newWave2, pos.screen.x, screenDisplacement, [0, wave.phase * wave.length], 0, 1, 0, 'black')
  drawLine(c, pos.screen.x, screenDisplacement, ...finalPhasor, 'black')
}

function makeBlocks ({ edges: e, firstSlit: f, width: w }, vSize) {
  const blocks = [0].concat(e.flat().map((v) => v + f + vSize / 2)).concat([vSize])
  return blocks.reduce((ac, cv, i, ar) => i % 2 ? ac.concat([[ar[i - 1], ar[i]]]) : ac, [])
}

function drawBackground (c, intensity, pos, amplitude, slit) {
  const blocks = makeBlocks(slit, pos.topViewXY.y)
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)
  c.fillStyle = 'lightgrey'
  c.strokeStyle = 'black'
  c.strokeRect(0, 0, c.canvas.width, c.canvas.height)
  c.strokeRect(0, 0, ...pos.topViewXY)
  c.strokeRect(pos.screen.x, 0, pos.screen.dx, pos.topViewXY.y)
  blocks.forEach(([y1, y2], i, a) => {
    c.fillRect(pos.grating.x - pos.grating.dx, y1, pos.grating.dx * 2, y2 - y1)
  })

  drawTrace(c, intensity[0], pos.screen.x, 0, 'rgba(255, 0, 0, 0.4)', 0, 1, -amplitude, 0)
  drawTrace(c, intensity[1], pos.screen.x, 0, 'rgba(0, 255, 0, 0.4)', 0, 1, -amplitude, 0)
  drawTrace(c, intensity[2], pos.screen.x, 0, 'black', 0, 1, -amplitude, 0)
  drawTrace(c, intensity[3], pos.screen.x - 100, 0, undefined, 0, 1, -amplitude, 0)
}

export { drawForground, drawBackground }
