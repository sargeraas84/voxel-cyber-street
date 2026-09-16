'use strict';
/** Shared canvas→PNG helper for the Node build tools. */
function canvasToPng(cv) {
  if (typeof cv.toBuffer === 'function') return cv.toBuffer('image/png'); // node-canvas
  return cv.toDataURL('image/png');                                       // fallback (browser)
}
module.exports = { canvasToPng };
