import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const publicRoot = path.join(process.cwd(), "public");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function stripJpegExif(bytes) {
  if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error("Invalid JPEG header");
  const parts = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("Invalid JPEG marker");
    const start = offset;
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    if (marker === 0xda || marker === 0xd9) {
      parts.push(bytes.subarray(start));
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(bytes.subarray(start, offset + 1));
      offset += 1;
      continue;
    }
    const length = bytes.readUInt16BE(offset + 1);
    const end = offset + 1 + length;
    if (length < 2 || end > bytes.length) throw new Error("Invalid JPEG segment");
    const isExif = marker === 0xe1 && bytes.subarray(offset + 3, offset + 9).equals(Buffer.from("Exif\0\0"));
    if (!isExif) parts.push(bytes.subarray(start, end));
    offset = end;
  }
  return Buffer.concat(parts);
}

function stripPngExif(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error("Invalid PNG header");
  const parts = [bytes.subarray(0, 8)];
  let offset = 8;
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error("Invalid PNG chunk");
    if (bytes.toString("ascii", offset + 4, offset + 8) !== "eXIf") parts.push(bytes.subarray(offset, end));
    offset = end;
  }
  return Buffer.concat(parts);
}

let stripped = 0;
for (const file of walk(publicRoot).filter((candidate) => /\.(jpe?g|png|webp|avif)$/i.test(candidate))) {
  const metadata = await sharp(file).metadata();
  if (!metadata.exif) continue;
  if (metadata.format !== "jpeg" && metadata.format !== "png") {
    throw new Error(`No lossless EXIF removal for ${file}`);
  }
  const source = fs.readFileSync(file);
  const output = metadata.format === "jpeg"
    ? stripJpegExif(source)
    : stripPngExif(source);
  if ((await sharp(output).metadata()).exif) throw new Error(`EXIF remains in ${file}`);
  fs.writeFileSync(file, output);
  stripped += 1;
  console.log(`Stripped EXIF: ${path.relative(process.cwd(), file)}`);
}
console.log(`EXIF removed from ${stripped} public images.`);
