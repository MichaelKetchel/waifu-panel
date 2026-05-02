interface QrVersionSpec {
  version: number;
  ecCodewordsPerBlock: number;
  dataCodewordsByBlock: number[];
}

export interface QrCode {
  modules: boolean[][];
  size: number;
}

interface QrMatrix {
  modules: boolean[][];
  reserved: boolean[][];
  size: number;
}

const VERSION_SPECS: QrVersionSpec[] = [
  { version: 1, ecCodewordsPerBlock: 7, dataCodewordsByBlock: [19] },
  { version: 2, ecCodewordsPerBlock: 10, dataCodewordsByBlock: [34] },
  { version: 3, ecCodewordsPerBlock: 15, dataCodewordsByBlock: [55] },
  { version: 4, ecCodewordsPerBlock: 20, dataCodewordsByBlock: [80] },
  { version: 5, ecCodewordsPerBlock: 26, dataCodewordsByBlock: [108] },
  { version: 6, ecCodewordsPerBlock: 18, dataCodewordsByBlock: [68, 68] }
];

const ALIGNMENT_PATTERN_CENTERS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34]
};

const MASK_PATTERNS: Array<(x: number, y: number) => boolean> = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
];

const GF_EXP = new Array<number>(512);
const GF_LOG = new Array<number>(256);

let gfValue = 1;
for (let i = 0; i < 255; i += 1) {
  GF_EXP[i] = gfValue;
  GF_LOG[gfValue] = i;
  gfValue <<= 1;
  if ((gfValue & 0x100) !== 0) {
    gfValue ^= 0x11d;
  }
}
for (let i = 255; i < GF_EXP.length; i += 1) {
  GF_EXP[i] = GF_EXP[i - 255];
}

export function createQrCode(value: string): QrCode | null {
  const bytes = Array.from(new TextEncoder().encode(value));
  const spec = VERSION_SPECS.find((candidate) => canFitBytes(bytes.length, candidate));

  if (!spec) return null;

  const dataCodewords = createDataCodewords(bytes, spec);
  const allCodewords = createCodewordsWithErrorCorrection(dataCodewords, spec);
  const baseMatrix = createBaseMatrix(spec.version);
  placeCodewords(baseMatrix, allCodewords);

  let bestModules: boolean[][] | null = null;
  let bestPenalty = Number.POSITIVE_INFINITY;

  MASK_PATTERNS.forEach((maskPattern, maskIndex) => {
    const modules = cloneModules(baseMatrix.modules);
    applyMask(modules, baseMatrix.reserved, maskPattern);
    drawFormatBits(modules, maskIndex);

    const penalty = calculatePenalty(modules);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestModules = modules;
    }
  });

  if (!bestModules) return null;

  return {
    modules: bestModules,
    size: baseMatrix.size
  };
}

function canFitBytes(byteLength: number, spec: QrVersionSpec) {
  const dataCapacityBits = spec.dataCodewordsByBlock.reduce((sum, value) => sum + value, 0) * 8;
  const countBits = spec.version < 10 ? 8 : 16;
  return 4 + countBits + byteLength * 8 <= dataCapacityBits;
}

function createDataCodewords(bytes: number[], spec: QrVersionSpec) {
  const bitBuffer: number[] = [];
  const dataCapacity = spec.dataCodewordsByBlock.reduce((sum, value) => sum + value, 0);
  const dataCapacityBits = dataCapacity * 8;

  appendBits(bitBuffer, 0b0100, 4);
  appendBits(bitBuffer, bytes.length, spec.version < 10 ? 8 : 16);
  bytes.forEach((byte) => appendBits(bitBuffer, byte, 8));

  const terminatorLength = Math.min(4, dataCapacityBits - bitBuffer.length);
  appendBits(bitBuffer, 0, terminatorLength);

  while (bitBuffer.length % 8 !== 0) {
    bitBuffer.push(0);
  }

  const codewords: number[] = [];
  for (let i = 0; i < bitBuffer.length; i += 8) {
    let value = 0;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value << 1) | bitBuffer[i + bit];
    }
    codewords.push(value);
  }

  let pad = 0xec;
  while (codewords.length < dataCapacity) {
    codewords.push(pad);
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  return codewords;
}

function appendBits(buffer: number[], value: number, length: number) {
  for (let i = length - 1; i >= 0; i -= 1) {
    buffer.push((value >>> i) & 1);
  }
}

function createCodewordsWithErrorCorrection(dataCodewords: number[], spec: QrVersionSpec) {
  const dataBlocks: number[][] = [];
  let offset = 0;

  spec.dataCodewordsByBlock.forEach((blockLength) => {
    dataBlocks.push(dataCodewords.slice(offset, offset + blockLength));
    offset += blockLength;
  });

  const ecBlocks = dataBlocks.map((block) => createErrorCorrectionCodewords(block, spec.ecCodewordsPerBlock));
  const codewords: number[] = [];
  const maxDataLength = Math.max(...dataBlocks.map((block) => block.length));

  for (let index = 0; index < maxDataLength; index += 1) {
    dataBlocks.forEach((block) => {
      if (index < block.length) codewords.push(block[index]);
    });
  }

  for (let index = 0; index < spec.ecCodewordsPerBlock; index += 1) {
    ecBlocks.forEach((block) => {
      codewords.push(block[index]);
    });
  }

  return codewords;
}

function createErrorCorrectionCodewords(dataCodewords: number[], ecCodewords: number) {
  const generator = createGeneratorPolynomial(ecCodewords);
  const remainder = new Array<number>(ecCodewords).fill(0);

  dataCodewords.forEach((codeword) => {
    const factor = codeword ^ remainder[0];
    remainder.shift();
    remainder.push(0);

    for (let i = 0; i < ecCodewords; i += 1) {
      remainder[i] ^= gfMultiply(generator[i + 1], factor);
    }
  });

  return remainder;
}

function createGeneratorPolynomial(degree: number) {
  let coefficients = [1];

  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(coefficients.length + 1).fill(0);
    coefficients.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= gfMultiply(coefficient, GF_EXP[i]);
    });
    coefficients = next;
  }

  return coefficients;
}

function gfMultiply(left: number, right: number) {
  if (left === 0 || right === 0) return 0;
  return GF_EXP[GF_LOG[left] + GF_LOG[right]];
}

function createBaseMatrix(version: number): QrMatrix {
  const size = 21 + (version - 1) * 4;
  const matrix: QrMatrix = {
    modules: createEmptyGrid(size),
    reserved: createEmptyGrid(size),
    size
  };

  drawFinderPattern(matrix, 0, 0);
  drawFinderPattern(matrix, size - 7, 0);
  drawFinderPattern(matrix, 0, size - 7);
  drawAlignmentPatterns(matrix, version);
  drawTimingPatterns(matrix);
  reserveFormatAreas(matrix);
  setFunctionModule(matrix, 8, size - 8, true);

  return matrix;
}

function createEmptyGrid(size: number) {
  return Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
}

function drawFinderPattern(matrix: QrMatrix, left: number, top: number) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const moduleX = left + x;
      const moduleY = top + y;
      if (!isInside(matrix, moduleX, moduleY)) continue;

      const inPattern = x >= 0 && x <= 6 && y >= 0 && y <= 6;
      const isDark =
        inPattern && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));

      setFunctionModule(matrix, moduleX, moduleY, isDark);
    }
  }
}

function drawAlignmentPatterns(matrix: QrMatrix, version: number) {
  const centers = ALIGNMENT_PATTERN_CENTERS[version] ?? [];

  centers.forEach((centerY) => {
    centers.forEach((centerX) => {
      if (matrix.reserved[centerY][centerX]) return;

      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          const distance = Math.max(Math.abs(x), Math.abs(y));
          setFunctionModule(matrix, centerX + x, centerY + y, distance === 0 || distance === 2);
        }
      }
    });
  });
}

function drawTimingPatterns(matrix: QrMatrix) {
  for (let i = 0; i < matrix.size; i += 1) {
    const isDark = i % 2 === 0;
    if (!matrix.reserved[6][i]) setFunctionModule(matrix, i, 6, isDark);
    if (!matrix.reserved[i][6]) setFunctionModule(matrix, 6, i, isDark);
  }
}

function reserveFormatAreas(matrix: QrMatrix) {
  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      reserveModule(matrix, 8, i);
      reserveModule(matrix, i, 8);
    }
  }

  for (let i = 0; i < 8; i += 1) {
    reserveModule(matrix, matrix.size - 1 - i, 8);
    reserveModule(matrix, 8, matrix.size - 1 - i);
  }
}

function reserveModule(matrix: QrMatrix, x: number, y: number) {
  if (!isInside(matrix, x, y)) return;
  matrix.reserved[y][x] = true;
}

function setFunctionModule(matrix: QrMatrix, x: number, y: number, value: boolean) {
  if (!isInside(matrix, x, y)) return;
  matrix.modules[y][x] = value;
  matrix.reserved[y][x] = true;
}

function isInside(matrix: QrMatrix, x: number, y: number) {
  return x >= 0 && x < matrix.size && y >= 0 && y < matrix.size;
}

function placeCodewords(matrix: QrMatrix, codewords: number[]) {
  const bits = codewords.flatMap((codeword) =>
    Array.from({ length: 8 }, (_value, index) => (codeword >>> (7 - index)) & 1)
  );
  let bitIndex = 0;
  let upward = true;

  for (let right = matrix.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;

    for (let vertical = 0; vertical < matrix.size; vertical += 1) {
      const y = upward ? matrix.size - 1 - vertical : vertical;

      for (let x = right; x >= right - 1; x -= 1) {
        if (matrix.reserved[y][x]) continue;
        matrix.modules[y][x] = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        bitIndex += 1;
      }
    }

    upward = !upward;
  }
}

function cloneModules(modules: boolean[][]) {
  return modules.map((row) => [...row]);
}

function applyMask(modules: boolean[][], reserved: boolean[][], maskPattern: (x: number, y: number) => boolean) {
  modules.forEach((row, y) => {
    row.forEach((_value, x) => {
      if (!reserved[y][x] && maskPattern(x, y)) {
        modules[y][x] = !modules[y][x];
      }
    });
  });
}

function drawFormatBits(modules: boolean[][], maskIndex: number) {
  const size = modules.length;
  const bits = createFormatBits(maskIndex);

  for (let i = 0; i <= 5; i += 1) setModule(modules, 8, i, getBit(bits, i));
  setModule(modules, 8, 7, getBit(bits, 6));
  setModule(modules, 8, 8, getBit(bits, 7));
  setModule(modules, 7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i += 1) setModule(modules, 14 - i, 8, getBit(bits, i));

  for (let i = 0; i < 8; i += 1) setModule(modules, size - 1 - i, 8, getBit(bits, i));
  for (let i = 8; i < 15; i += 1) setModule(modules, 8, size - 15 + i, getBit(bits, i));
  setModule(modules, 8, size - 8, true);
}

function createFormatBits(maskIndex: number) {
  const errorCorrectionLevelBits = 0b01;
  const data = (errorCorrectionLevelBits << 3) | maskIndex;
  let remainder = data << 10;

  for (let bit = mostSignificantBit(remainder); bit >= 10; bit = mostSignificantBit(remainder)) {
    remainder ^= 0x537 << (bit - 10);
  }

  return ((data << 10) | remainder) ^ 0x5412;
}

function mostSignificantBit(value: number) {
  for (let bit = 31; bit >= 0; bit -= 1) {
    if (((value >>> bit) & 1) !== 0) return bit;
  }
  return -1;
}

function getBit(value: number, bit: number) {
  return ((value >>> bit) & 1) !== 0;
}

function setModule(modules: boolean[][], x: number, y: number, value: boolean) {
  modules[y][x] = value;
}

function calculatePenalty(modules: boolean[][]) {
  const size = modules.length;
  let penalty = 0;

  for (let y = 0; y < size; y += 1) {
    penalty += calculateRunPenalty(modules[y]);
    penalty += calculateFinderPenalty(modules[y]);
  }

  for (let x = 0; x < size; x += 1) {
    const column = modules.map((row) => row[x]);
    penalty += calculateRunPenalty(column);
    penalty += calculateFinderPenalty(column);
  }

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const value = modules[y][x];
      if (modules[y][x + 1] === value && modules[y + 1][x] === value && modules[y + 1][x + 1] === value) {
        penalty += 3;
      }
    }
  }

  const total = size * size;
  const dark = modules.flat().filter(Boolean).length;
  penalty += Math.floor(Math.abs(dark * 20 - total * 10) / total) * 10;

  return penalty;
}

function calculateRunPenalty(line: boolean[]) {
  let penalty = 0;
  let runColor = line[0];
  let runLength = 1;

  for (let i = 1; i < line.length; i += 1) {
    if (line[i] === runColor) {
      runLength += 1;
      continue;
    }

    if (runLength >= 5) penalty += 3 + (runLength - 5);
    runColor = line[i];
    runLength = 1;
  }

  if (runLength >= 5) penalty += 3 + (runLength - 5);
  return penalty;
}

function calculateFinderPenalty(line: boolean[]) {
  const pattern = [true, false, true, true, true, false, true];
  let penalty = 0;

  for (let i = 0; i <= line.length - pattern.length; i += 1) {
    const matches = pattern.every((value, offset) => line[i + offset] === value);
    if (!matches) continue;

    const beforeIsLight = i >= 4 && line.slice(i - 4, i).every((value) => !value);
    const afterIsLight = i + 11 <= line.length && line.slice(i + 7, i + 11).every((value) => !value);
    if (beforeIsLight || afterIsLight) penalty += 40;
  }

  return penalty;
}
