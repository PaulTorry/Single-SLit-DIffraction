/* eslint-disable no-unused-vars */
/* global Vec */

import { Vec } from '../Vec.js'

class Grating {
  constructor (number = 2, width = 1, separation = 2, vSize = 100) {
    this.vSize = vSize
    this.number = number; this.width = width; this.separation = separation
    this.firstSlit = -((number - 1) / 2) * (separation) - width / 2
    this.centres = Array(Number.parseInt(number)).fill().map((_, i) => i * (separation) + width / 2)
    this.edges = this.centres.map((v) => [v - width / 2, v + width / 2])
    // console.log(this.centres, this.edges)
  }

  update (n = this.number, w = this.width, s = this.separation, vSize = this.vSize) {
    return new Grating(n, w, s, vSize)
  }
}

class Ray {
  constructor (grating = new Grating(), d = 1, D = 100, wave = { length: 2, phase: 0, amplitude: 20 }) {
    this.grating = grating; this.wave = wave
    this.length = grating.number
    this.geo = Ray.getGeometry(d, D)
    this.centerPhasors = grating.centres.map(c => Vec.fromCircularCoords(1, -wave.phase + c * this.geo.sin / wave.length))
    this.edgePhasors = grating.edges.map(c => c.map(cc => Vec.fromCircularCoords(1, -wave.phase + cc * this.geo.sin / wave.length)))
    this.posOfPhasor = this.grating.edges.map(c => c.map(cc => Vec.unitX.rotate(this.geo.theta).scale(-cc * this.geo.sin)))
    this.phasorAtGrating = this.edgePhasors[0][0]
    this.integrals = this.edgePhasors.map(c => c[0].integrateTo(c[1]).scale(5 / (grating.width * this.geo.sin)))
    this.lengthOfIntegral = Math.sin((grating.edges[0][1] - grating.edges[0][0]) * 0.5 * (this.geo.sin / wave.length)) * 10 / (grating.width * this.geo.sin)
    this.resultant = grating.centres.reduce((p, c) => p.add(Vec.fromCircularCoords(1, -wave.phase + c * this.geo.sin / wave.length)), new Vec(0, 0))
    this.singleSlitModulation = wave.length * Math.abs(Math.sin((grating.width) * 0.5 * (this.geo.sin / wave.length)) * 4 / (grating.width * this.geo.sin))
    this.zipped = Array(this.length).fill().map((c, i, a) => {
      return { e: this.grating.edges[i], ep: this.edgePhasors[i], integral: this.integrals[i], posPonB: this.posOfPhasor[i] }
    })
  }

  getDataForSlit (i = 0) {
    return { sin: this.geo.sin, edges: this.grating.edges[i], ePh: this.edgePhasors[i], res: this.resultant }
  }

  print (i = 0) { console.log(this.geo.sin, this.grating.edges[i], this.edgePhasors[i], this.resultant) }

  getRay (d = 1) {
    return new Ray(this.grating, d, this.geo.D, this.wave)
  }

  updateSlit (grating) {
    return new Ray(grating, this.d, this.geo.D, this.wave)
  }

  static getGeometry (d, D) {
    const theta = Math.atan(-d / D)
    const l = Math.sqrt(D * D + d * d)
    const sin = d / l
    const cos = D / l
    const tan = d / D
    return { d, D, theta, l, sin, cos, tan }
  }
}

class IntensityPattern {
  constructor (vSize) {
    this.vSize = vSize
    this.values = Array(4).fill(0).map(c => Array(vSize).fill(0))
  }

  addIntensity (ray, d = ray.d) {
    const screenD = d + this.vSize / 2
    for (let i = screenD - 4; i <= screenD + 4; i++) {
      if (i > 0 && i < this.vSize) {
        const thisRay = ray.getRay(i - this.vSize / 2)
        this.values[0][i] = thisRay.resultant.mag
        this.values[1][i] = thisRay.singleSlitModulation
        this.values[2][i] = thisRay.resultant.mag * thisRay.singleSlitModulation
      }
    }
  }

  recordIntensites () { this.values[3] = this.values[2].map(a => a) }
}

export { Grating, Ray, IntensityPattern }
