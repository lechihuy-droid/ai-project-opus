import fs from "node:fs";
import zlib from "node:zlib";

const PNG_SIGNATURE = "89504e470d0a1a0a";

const paeth = (left, above, upperLeft) => {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
};

export const inspectPng = (file) => {
  const png = fs.readFileSync(file);
  if (png.subarray(0, 8).toString("hex") !== PNG_SIGNATURE) {
    throw new Error(`Expected PNG file: ${file}`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    }
    if (type === "IDAT") idat.push(data);
    offset += length + 12;
    if (type === "IEND") break;
  }

  const bytesPerPixel = colorType === 2 ? 3 : colorType === 6 ? 4 : 0;
  if (!width || !height || bitDepth !== 8 || !bytesPerPixel || idat.length === 0) {
    throw new Error(`Unsupported PNG format in ${file}: bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const scanlines = zlib.inflateSync(Buffer.concat(idat));
  const rowBytes = width * bytesPerPixel;
  const expectedBytes = height * (rowBytes + 1);
  if (scanlines.length !== expectedBytes) {
    throw new Error(`Unexpected PNG scanline length in ${file}`);
  }

  let cursor = 0;
  let previous = new Uint8Array(rowBytes);
  let luminanceLow = 255;
  let luminanceHigh = 0;
  let saturationTotal = 0;
  for (let row = 0; row < height; row += 1) {
    const filter = scanlines[cursor++];
    const current = new Uint8Array(rowBytes);
    for (let index = 0; index < rowBytes; index += 1) {
      const raw = scanlines[cursor++];
      const left = index >= bytesPerPixel ? current[index - bytesPerPixel] : 0;
      const above = previous[index];
      const upperLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;
      if (filter === 0) current[index] = raw;
      else if (filter === 1) current[index] = (raw + left) & 255;
      else if (filter === 2) current[index] = (raw + above) & 255;
      else if (filter === 3) current[index] = (raw + Math.floor((left + above) / 2)) & 255;
      else if (filter === 4) current[index] = (raw + paeth(left, above, upperLeft)) & 255;
      else throw new Error(`Unsupported PNG filter ${filter} in ${file}`);
    }
    for (let pixel = 0; pixel < rowBytes; pixel += bytesPerPixel) {
      const red = current[pixel];
      const green = current[pixel + 1];
      const blue = current[pixel + 2];
      const luminance = Math.round(0.2126 * red + 0.7152 * green + 0.0722 * blue);
      luminanceLow = Math.min(luminanceLow, luminance);
      luminanceHigh = Math.max(luminanceHigh, luminance);
      saturationTotal += Math.max(red, green, blue) - Math.min(red, green, blue);
    }
    previous = current;
  }

  const dynamicRange = luminanceHigh - luminanceLow;
  const saturationAverage = saturationTotal / (width * height);
  return {
    width,
    height,
    dynamicRange: Number(dynamicRange.toFixed(2)),
    saturationAverage: Number(saturationAverage.toFixed(5)),
    passed: dynamicRange >= 8 || saturationAverage >= 3,
    heuristic: "decoded PNG luminance range or RGB saturation threshold",
  };
};
