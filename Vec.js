class Vec {
  constructor (x = 0, y = 0) { this.x = x; this.y = y }

  * [Symbol.iterator] () {
    yield this.x
    yield this.y
  }

  add (b) { return new Vec(this.x + b.x, this.y + b.y) }
  addXY (x, y) { return new Vec(this.x + x, this.y + y) }
  subtract (b) { return new Vec(this.x - b.x, this.y - b.y) }
  scaleByVec (a) { return new Vec(this.x * a.x, this.y * a.y) }
  scaleXY (x, y) { return new Vec(this.x * x, this.y * y) }
  scale (m) { return new Vec(this.x * m, this.y * m) }
  rotate (theta, p) { return Vec.rotate(this, theta, p) }
  toCircularCoords (a) { return Vec.toCircularCoords(this) }

  dot (b) { return this.x * b.x + this.y * b.y }
  invert () { return this.scale(-1) }
  distance (a) {
    return this.subtract(a).mag
  }

  bounds (b1, b2 = b1.invert()) {
    const x2 = Math.min(b2.x, b1.x); const x1 = Math.max(b2.x, b1.x)
    const y2 = Math.min(b2.y, b1.y); const y1 = Math.max(b2.y, b1.y)
    const x = Math.max(x2, Math.min(x1, this.x))
    const y = Math.max(y2, Math.min(y1, this.y))
    return new Vec(x, y)
  }

  get mag () { return Math.sqrt((this.x * this.x) + (this.y * this.y)) }

  static fromID (id) {
    return new Vec(...(id.split(',')).map(parseFloat))
  }

  static rotate (a, th, p = new Vec(0, 0)) {
    const x = a.x - p.x; const y = a.y - p.y
    return new Vec(x * Math.cos(th) + y * Math.sin(th), x * -Math.sin(th) + y * Math.cos(th))
  }

  static fromIdArray (idArray) {
    return idArray.map(Vec.fromID)
  }

  static fromCircularCoords (r, theta) {
    return new Vec(r * Math.sin(theta), r * Math.cos(theta))
  }

  static toCircularCoords (a) {
    return { r: Math.sqrt(a.x * a.x + a.y * a.y), theta: Math.atan(a.x / a.y) }
  }

  // static zero = new Vec(0, 0)
  // static unit = new Vec(1, 1)
}
