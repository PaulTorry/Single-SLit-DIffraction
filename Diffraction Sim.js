
/* global
event
*/
var canvas = document.querySelector('canvas')
var iPlot = []

var cx = canvas.getContext('2d')
var wavelength = 0.5; var ratio = 20
var gratingX = 50; var gratingWidth = 3; var screenPos = 400
var gratingH = 200; var slitwidth = 60
var lastY; var lastX
var theta = 0
var gratingTopMargin = 20
var focusPos = 20; var sinStep = 2
var thetaDelayAxisY = 300; var tetaDelayAPos = 100; var thetaAmplitude = 50
var slitDispAaxisY = 450; var slitDelayXPosA = 100; var slitDelayXPosB = 300; var slitAmplitude = 50
var timeDispAxisY = 600; var timePos = 100
var canvasWidth = cx.canvas.width
function slitCentrePos () { return gratingTopMargin + gratingH / 2 }
function focusTanAngle () { return focusPos / (screenPos - gratingX - gratingWidth) }
cx.canvas.addEventListener('mousedown', eventHandler)

for (var iiii = 0; iiii < gratingH / 2; iiii++) { iPlot.push(0) }
// console.log(iPlot)

function eventHandler (e) {
  // console.log(e.pageX + ' ' + e.pageY)
  if (e.pageX >= 200 && e.pageX <= 420 && e.pageY <= 200) {
    cx.canvas.addEventListener('mousemove', movedv)
  }
  if (e.pageY >= 250 && e.pageY <= 350) {
    cx.canvas.addEventListener('mousemove', movedt)
  }
  // console.log(focusPos)
  update()
}

function movedv (e) {
  if (!buttonPressed(event)) {
    cx.canvas.removeEventListener('mousemove', movedv)
  } else {
    if (lastY == null) { lastY = event.pageY }
    var dist = event.pageY - lastY
    focusPos += dist

    focusPos = Math.max(0, focusPos)
    focusPos = Math.min(gratingH / 2, focusPos)
    lastY = event.pageY
  }
  record()
  update()
}

function movedt (e) {
  if (!buttonPressed(event)) {
    cx.canvas.removeEventListener('mousemove', movedt)
  } else {
    if (lastX == null) { lastX = event.pageX }
    var dist = event.pageX - lastX
    theta += dist / (wavelength * ratio)
    lastX = event.pageX
  }
  record()
  update()
}

function buttonPressed (event) {
  if (event.buttons == null) { return event.which !== 0 } else { return event.buttons !== 0 }
}

function record () {
  if (theta >= 10) {
    iPlot[focusPos] = Math.max(getAmplitude(), -getAmplitude())
    // console.log(iPlot)
  }
}

function drawBackground () {
  var gH1 = gratingTopMargin + (gratingH - slitwidth) / 2
  var gH2 = gratingTopMargin + (gratingH + slitwidth) / 2
  cx.fillStyle = 'black'
  cx.strokeStyle = 'black'
  cx.strokeRect(0, 0, cx.canvas.width, cx.canvas.height)
  cx.strokeRect(gratingX, gratingTopMargin, gratingWidth, gH1 - gratingTopMargin)
  cx.strokeRect(gratingX, gH2, gratingWidth, gratingTopMargin + gratingH - gH2)
  cx.strokeRect(screenPos, gratingTopMargin, 1, gratingH)
  cx.fillText('A', gratingX - 5 - gratingWidth, gH1)
  cx.fillText('B', gratingX - 5 - gratingWidth, gH2)
}

function clearBackGround (color) {
  cx.fillStyle = 'white'
  if (color) { cx.fillStyle = color }
  cx.fillRect(0, 0, cx.canvas.width, cx.canvas.height)
}

function deltaL () {
  if (focusTanAngle === 0) { return 0 } else { return Math.sin((Math.atan(focusTanAngle()))) * slitwidth }
}

function drawForeground () {
  function drawRayPerp () {
    var angle = Math.atan(focusTanAngle()) + Math.PI / 2
    //        console.log("focusTanAngle() " + focusTanAngle());
    //        console.log("angle " + angle);
    drawLine(gratingX, slitCentrePos() + slitwidth / 2, gratingX - slitwidth * Math.cos(angle), slitCentrePos() - slitwidth / 2 + Math.sin(angle), 'blue')
  }
  // Draw rays
  drawLine(gratingX, slitCentrePos() + slitwidth / 2, screenPos / 2, focusPos / 2 + slitwidth / 2 + slitCentrePos(), 'grey')
  drawLine(gratingX, slitCentrePos() - slitwidth / 2, screenPos / 2, focusPos / 2 - slitwidth / 2 + slitCentrePos(), 'grey')
  drawLine(gratingX, slitCentrePos(), screenPos, focusPos + slitCentrePos(), 'red')
  drawRayPerp()

//  fillSine(50, 400, 10, 0, 10, 500, 1, 50, "red");
}

function drawDeltaTheta () {
  drawLine(0, thetaDelayAxisY, canvasWidth, thetaDelayAxisY, 'grey')
  drawLine(tetaDelayAPos, thetaDelayAxisY + thetaAmplitude, tetaDelayAPos, thetaDelayAxisY - thetaAmplitude, 'grey')
  cx.fillText('A', tetaDelayAPos - 5, thetaDelayAxisY - thetaAmplitude)
  drawLine(tetaDelayAPos + 10 * deltaL(), thetaDelayAxisY + thetaAmplitude, tetaDelayAPos + 10 * deltaL(), thetaDelayAxisY - thetaAmplitude, 'blue')
  cx.fillText('B', tetaDelayAPos - 5 + 10 * deltaL(), thetaDelayAxisY - thetaAmplitude)
  drawSine(50, thetaDelayAxisY, 10, tetaDelayAPos, 500, wavelength, 'red')
  drawLine(tetaDelayAPos + 10 * deltaL(), thetaDelayAxisY + thetaAmplitude, slitDelayXPosB, slitDispAaxisY - slitAmplitude, 'blue')
}

function drawSlitWidth () {
  drawLine(0, slitDispAaxisY, canvasWidth, slitDispAaxisY, 'grey')
  drawLine(slitDelayXPosA, slitDispAaxisY + slitAmplitude, slitDelayXPosA, slitDispAaxisY - slitAmplitude, 'grey')
  drawLine(slitDelayXPosB, slitDispAaxisY + slitAmplitude, slitDelayXPosB, slitDispAaxisY - slitAmplitude, 'blue')
  //    var slitRatio =
  drawSine(50, slitDispAaxisY, 10, slitDelayXPosA, 500, wavelength * 20 / (deltaL()), 'red')
  fillSine(slitDelayXPosA, slitDispAaxisY, 15, slitDelayXPosA, slitDelayXPosB - slitDelayXPosA, wavelength * 20 / (deltaL()), 'red')
}

//    var timeDispAxisY = 600; var timePos = 100; ampMultiplier = 1;

function drawTimeDepResultant () {
  drawLine(0, timeDispAxisY, canvasWidth, timeDispAxisY, 'grey')
  drawLine(timePos, timeDispAxisY + slitAmplitude, timePos, timeDispAxisY - slitAmplitude, 'grey')
  drawSine(slitDelayXPosA, timeDispAxisY, 200 * getAmplitude(), slitDelayXPosA + 0 * deltaL(), ratio * theta * wavelength, wavelength, 'red')
}

function drawIntensityPat (x1, y1) {
  cx.strokeStyle = 'red'
  cx.beginPath()
  cx.moveTo(x1, y1)
  for (var intpo = 0; intpo < gratingH / 2; intpo++) {
    cx.lineTo(x1 + 100 * iPlot[intpo], y1 + intpo)
    cx.lineTo(x1, y1 + intpo)
  }
  cx.moveTo(x1, y1)
  for (var intpo1 = 0; intpo1 < gratingH / 2; intpo1++) {
    cx.lineTo(x1 + 100 * iPlot[intpo1], y1 - intpo1)
    cx.lineTo(x1, y1 - intpo1)
  }
  cx.stroke()
}

function getAmplitude () {
  if (deltaL() === 0) { return 0.5 * wavelength } else { return wavelength * Math.sin(0.25 * deltaL() / wavelength) / deltaL() };
}

function update () {
  clearBackGround()
  drawBackground()
  drawForeground()
  drawDeltaTheta()
  drawSlitWidth()
  drawTimeDepResultant()
  drawIntensityPat(screenPos, gratingH / 2 + gratingTopMargin)
  //  console.log(getAmplitude());
}
update()

function drawLine (x1, y1, x2, y2, color) {
  if (color) { cx.strokeStyle = color }
  cx.beginPath()
  cx.moveTo(x1, y1)
  cx.lineTo(x2, y2)
  cx.stroke()
}

function drawSine (x1, y1, A, xZero, length, wl, color) {
  newSin(new Vec(x1, y1), length, A, wl, xZero)

//   function xPosToTheta (x) {
//     // console.log((x- xZero)/(wavelength*ratio) - theta);
//     return (x - xZero) / (wl * ratio) - theta
//   }
//   if (color) { cx.strokeStyle = color }
//   cx.beginPath()
//   cx.moveTo(x1, y1)
//   for (var xx = x1; xx <= x1 + length; xx += sinStep) {
//     cx.lineTo(xx, y1 + A * Math.sin(xPosToTheta(xx)))
//   }
//   cx.stroke()
}

function newSin (startPos, length, A = slitAmplitude, lambda = wavelength, thetsa = theta, scale = 1, deflectionAngle = 1, colour = 'black', fill = [[10, 12, 'blue']]) {
  const dispAtX = (x) => A * Math.sin((x) / (lambda * ratio) - theta)
  const pageVec = (x, y) => new Vec(x, y).rotate(deflectionAngle).add(startPos)
  const plot = (x, dx) => {
    cx.beginPath()
    cx.moveTo(...pageVec(x, 0))
    for (let dl = x; dl <= x + dx; dl += sinStep) {
      cx.lineTo(...pageVec(dl, dispAtX(dl)))
    }
    cx.lineTo(...pageVec(x + dx, 0))
  }

  cx.strokeStyle = colour
  plot(0, length)
  cx.stroke()

  if (fill) {
    for (const [x, dx, col] of fill) {
      cx.fillStyle = col
      plot(x, dx)
      cx.fill()
    }
  }
}

function fillSine (x1, y1, A, xZero, length, wl, color) {
  function xPosToTheta (x) {
    //    console.log((x- xZero)/(wl*ratio) - theta);
    return (x - xZero) / (wl * ratio) - theta
  }
  if (color) { cx.strokeStyle = color }
  cx.beginPath()
  cx.moveTo(x1, y1)
  for (var xx = x1; xx <= x1 + length; xx += sinStep) {
    cx.lineTo(xx, y1 + A * Math.sin(xPosToTheta(xx)))
  }
  cx.lineTo(x1 + length, y1)
  cx.lineTo(x1, y1)
  cx.fill()
}

function findSlitCenters (n, w, s, edge) {
  const offset = ((n - 1) / 2) * (w + s)
  const centers = Array(n).fill().map((n, i) => i * (w + s) - offset)
  console.log(offset, centers)
  return centers
}

console.log(findSlitCenters(6, 1, 10, 200))
