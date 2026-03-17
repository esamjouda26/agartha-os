/**
 * Minimal QR-code-style SVG generator.
 * Produces a deterministic grid pattern from a string input.
 * This is a VISUAL representation only — not a scannable QR code.
 * For production, replace with a real QR library like `qrcode`.
 */
export function generateQrSvg(data: string, size = 130): string {
  const modules = 21; // 21×21 grid (Version 1 QR)
  const cellSize = size / modules;

  // Simple hash-based pattern from the input string
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  // Seed a simple PRNG from the hash
  let seed = Math.abs(hash);
  function nextRand() {
    seed = (seed * 16807 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  const cells: string[] = [];

  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      // Always fill finder patterns (top-left, top-right, bottom-left)
      const inFinderTL = row < 7 && col < 7;
      const inFinderTR = row < 7 && col >= modules - 7;
      const inFinderBL = row >= modules - 7 && col < 7;

      let fill = false;

      if (inFinderTL || inFinderTR || inFinderBL) {
        // Finder pattern: outer border, inner square
        const lr = inFinderTL ? row : inFinderTR ? row : row - (modules - 7);
        const lc = inFinderTL ? col : inFinderTR ? col - (modules - 7) : col;
        fill = lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        fill = nextRand() > 0.55;
      }

      if (fill) {
        cells.push(
          `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000" />`
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="#fff" />
    ${cells.join("\n    ")}
  </svg>`;
}
