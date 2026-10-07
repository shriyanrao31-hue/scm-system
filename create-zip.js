/**
 * Standalone Zero-Dependency Project Archiver
 * Compresses the entire repository into `scm-4k-prototype.zip` using Node.js built-in modules (`fs`, `path`, `zlib`).
 * Implements the standard PKZip 2.0 specification without external dependencies.
 * 
 * Usage:
 *   node create-zip.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = __dirname;
const OUTPUT_ZIP = path.join(ROOT_DIR, 'scm-4k-prototype.zip');

// Files or directories to exclude from the zip bundle
const EXCLUDES = new Set([
  'node_modules',
  '.git',
  'scm-4k-prototype.zip'
]);

// Helper to compute standard CRC32
function makeCrcTable() {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
}

const crcTable = makeCrcTable();

function calculateCrc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

// Convert Date to MS-DOS date & time format
function dosDateTime(date) {
  const d = date || new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
  const dateVal = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date: dateVal };
}

// Recursively traverse files
function getAllFiles(dir, base = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (EXCLUDES.has(item)) continue;
    const fullPath = path.join(dir, item);
    const relPath = base ? `${base}/${item}` : item;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, relPath));
    } else {
      results.push({ fullPath, relPath: relPath.replace(/\\/g, '/'), stat });
    }
  }
  return results;
}

console.log('📦 Starting Zero-Dependency Zip Compression...');

const files = getAllFiles(ROOT_DIR);
console.log(`🔍 Found ${files.length} project files to archive.`);

const localHeaders = [];
const centralDirectoryHeaders = [];
let currentOffset = 0;

const zipParts = [];

for (const file of files) {
  const uncompressedData = fs.readFileSync(file.fullPath);
  const uncompressedSize = uncompressedData.length;
  const crc32 = calculateCrc32(uncompressedData);

  // Compress using deflateRaw
  const compressedData = zlib.deflateRawSync(uncompressedData);
  const compressedSize = compressedData.length;

  const fileNameBuffer = Buffer.from(file.relPath, 'utf8');
  const fileNameLen = fileNameBuffer.length;
  const dos = dosDateTime(file.stat.mtime);

  // 1. Local File Header (30 bytes + fileNameLen)
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
  localHeader.writeUInt16LE(20, 4);         // Version needed to extract (2.0)
  localHeader.writeUInt16LE(0, 6);          // General purpose bit flag
  localHeader.writeUInt16LE(8, 8);          // Compression method: 8 = Deflate
  localHeader.writeUInt16LE(dos.time, 10);  // Last mod file time
  localHeader.writeUInt16LE(dos.date, 12);  // Last mod file date
  localHeader.writeUInt32LE(crc32, 14);     // CRC-32
  localHeader.writeUInt32LE(compressedSize, 18);   // Compressed size
  localHeader.writeUInt32LE(uncompressedSize, 22); // Uncompressed size
  localHeader.writeUInt16LE(fileNameLen, 26);      // File name length
  localHeader.writeUInt16LE(0, 28);                // Extra field length

  zipParts.push(localHeader);
  zipParts.push(fileNameBuffer);
  zipParts.push(compressedData);

  // 2. Central Directory Header (46 bytes + fileNameLen)
  const cdHeader = Buffer.alloc(46);
  cdHeader.writeUInt32LE(0x02014b50, 0);    // Central directory header signature
  cdHeader.writeUInt16LE(20, 4);            // Version made by
  cdHeader.writeUInt16LE(20, 6);            // Version needed to extract
  cdHeader.writeUInt16LE(0, 8);             // General purpose bit flag
  cdHeader.writeUInt16LE(8, 10);            // Compression method
  cdHeader.writeUInt16LE(dos.time, 12);     // Last mod file time
  cdHeader.writeUInt16LE(dos.date, 14);     // Last mod file date
  cdHeader.writeUInt32LE(crc32, 16);        // CRC-32
  cdHeader.writeUInt32LE(compressedSize, 20);   // Compressed size
  cdHeader.writeUInt32LE(uncompressedSize, 24); // Uncompressed size
  cdHeader.writeUInt16LE(fileNameLen, 28);      // File name length
  cdHeader.writeUInt16LE(0, 30);            // Extra field length
  cdHeader.writeUInt16LE(0, 32);            // File comment length
  cdHeader.writeUInt16LE(0, 34);            // Disk number start
  cdHeader.writeUInt16LE(0, 36);            // Internal file attributes
  cdHeader.writeUInt32LE(0, 38);            // External file attributes
  cdHeader.writeUInt32LE(currentOffset, 42);// Relative offset of local header

  centralDirectoryHeaders.push(cdHeader);
  centralDirectoryHeaders.push(fileNameBuffer);

  currentOffset += 30 + fileNameLen + compressedSize;
}

const centralDirOffset = currentOffset;
let centralDirSize = 0;

for (const part of centralDirectoryHeaders) {
  zipParts.push(part);
  centralDirSize += part.length;
}

// 3. End of Central Directory Record (22 bytes)
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);                 // EOCD signature
eocd.writeUInt16LE(0, 4);                          // Number of this disk
eocd.writeUInt16LE(0, 6);                          // Disk where central directory starts
eocd.writeUInt16LE(files.length, 8);               // Number of central directory records on this disk
eocd.writeUInt16LE(files.length, 10);              // Total number of central directory records
eocd.writeUInt32LE(centralDirSize, 12);            // Size of central directory
eocd.writeUInt32LE(centralDirOffset, 16);          // Offset of start of central directory
eocd.writeUInt16LE(0, 20);                         // Comment length

zipParts.push(eocd);

const finalZipBuffer = Buffer.concat(zipParts);
fs.writeFileSync(OUTPUT_ZIP, finalZipBuffer);

console.log(`✅ SUCCESS! Project compressed into: ${OUTPUT_ZIP}`);
console.log(`📊 Archive Size: ${(finalZipBuffer.length / 1024).toFixed(2)} KB (${finalZipBuffer.length} bytes)`);
