export class ScopeEngine {
  private static instance: ScopeEngine | null = null;

  constructor() {}

  public static getInstance(): ScopeEngine {
    if (!ScopeEngine.instance) {
      ScopeEngine.instance = new ScopeEngine();
    }
    return ScopeEngine.instance;
  }

  /**
   * GENERATE WAVEFORM CHART
   * Scans input pixels to map signal levels vertically against column locations
   */
  public generateWaveform(
    rgbaData: Uint8ClampedArray,
    imgWidth: number,
    imgHeight: number,
    targetWidth: number = 256,
    targetHeight: number = 256
  ): Uint8ClampedArray {
    const scopeData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    // Initialize background with dark gray grid lines
    this.drawGridBackground(scopeData, targetWidth, targetHeight);

    const columns = targetWidth;
    const sampleRate = Math.max(1, Math.floor(imgWidth / columns));

    // Accumulator grid to count pixel occurrences at vertical offsets [col][luma]
    const grid = Array.from({ length: columns }, () => new Float32Array(targetHeight));

    for (let c = 0; c < columns; c++) {
      const srcX = Math.min(imgWidth - 1, c * sampleRate);
      for (let y = 0; y < imgHeight; y += 4) { // downsample vertically for performance
        const pixelIdx = (y * imgWidth + srcX) * 4;
        const r = rgbaData[pixelIdx];
        const g = rgbaData[pixelIdx + 1];
        const b = rgbaData[pixelIdx + 2];

        // Rec.709 Luma equation
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const yPos = Math.floor((1.0 - luma / 255) * (targetHeight - 1));
        const clampedY = Math.max(0, Math.min(targetHeight - 1, yPos));
        grid[c][clampedY]++;
      }
    }

    // Render counts as high-contrast glowing lines
    for (let x = 0; x < targetWidth; x++) {
      // Find max count in this column to normalize brightness
      let maxCount = 0;
      for (let y = 0; y < targetHeight; y++) {
        if (grid[x][y] > maxCount) maxCount = grid[x][y];
      }

      for (let y = 0; y < targetHeight; y++) {
        const count = grid[x][y];
        if (count > 0) {
          const intensity = Math.min(255, Math.floor((count / (maxCount || 1)) * 255));
          const idx = (y * targetWidth + x) * 4;

          // Glowing cyan/green wave trace
          scopeData[idx] = Math.max(scopeData[idx], Math.floor(intensity * 0.4));     // R
          scopeData[idx + 1] = Math.max(scopeData[idx + 1], intensity);               // G
          scopeData[idx + 2] = Math.max(scopeData[idx + 2], Math.floor(intensity * 0.9)); // B
          scopeData[idx + 3] = 255;                                                  // A
        }
      }
    }

    return scopeData;
  }

  /**
   * GENERATE RGB PARADE CHART
   * Splits chart horizontally into Red, Green, and Blue segments, showing individual column profiles
   */
  public generateRGBParade(
    rgbaData: Uint8ClampedArray,
    imgWidth: number,
    imgHeight: number,
    targetWidth: number = 256,
    targetHeight: number = 256
  ): Uint8ClampedArray {
    const scopeData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    this.drawGridBackground(scopeData, targetWidth, targetHeight);

    const segmentWidth = Math.floor(targetWidth / 3);

    // Grid accumulator grids for R, G, B
    const rGrid = Array.from({ length: segmentWidth }, () => new Float32Array(targetHeight));
    const gGrid = Array.from({ length: segmentWidth }, () => new Float32Array(targetHeight));
    const bGrid = Array.from({ length: segmentWidth }, () => new Float32Array(targetHeight));

    const sampleRate = Math.max(1, Math.floor(imgWidth / segmentWidth));

    for (let c = 0; c < segmentWidth; c++) {
      const srcX = Math.min(imgWidth - 1, c * sampleRate);
      for (let y = 0; y < imgHeight; y += 4) {
        const pixelIdx = (y * imgWidth + srcX) * 4;
        const r = rgbaData[pixelIdx];
        const g = rgbaData[pixelIdx + 1];
        const b = rgbaData[pixelIdx + 2];

        const rPos = Math.floor((1.0 - r / 255) * (targetHeight - 1));
        const gPos = Math.floor((1.0 - g / 255) * (targetHeight - 1));
        const bPos = Math.floor((1.0 - b / 255) * (targetHeight - 1));

        rGrid[c][Math.max(0, Math.min(targetHeight - 1, rPos))]++;
        gGrid[c][Math.max(0, Math.min(targetHeight - 1, gPos))]++;
        bGrid[c][Math.max(0, Math.min(targetHeight - 1, bPos))]++;
      }
    }

    // Function to render segment waveforms
    const renderSegment = (grid: Float32Array[], colOffset: number, colorMask: [number, number, number]) => {
      for (let x = 0; x < segmentWidth; x++) {
        let maxCount = 0;
        for (let y = 0; y < targetHeight; y++) {
          if (grid[x][y] > maxCount) maxCount = grid[x][y];
        }

        for (let y = 0; y < targetHeight; y++) {
          const count = grid[x][y];
          if (count > 0) {
            const intensity = Math.min(255, Math.floor((count / (maxCount || 1)) * 255));
            const targetX = colOffset + x;
            const idx = (y * targetWidth + targetX) * 4;

            scopeData[idx] = Math.max(scopeData[idx], Math.floor(intensity * colorMask[0]));
            scopeData[idx + 1] = Math.max(scopeData[idx + 1], Math.floor(intensity * colorMask[1]));
            scopeData[idx + 2] = Math.max(scopeData[idx + 2], Math.floor(intensity * colorMask[2]));
            scopeData[idx + 3] = 255;
          }
        }
      }
    };

    // Render Red (Left), Green (Center), Blue (Right) segments
    renderSegment(rGrid, 0, [1.0, 0.15, 0.15]);
    renderSegment(gGrid, segmentWidth, [0.15, 1.0, 0.15]);
    renderSegment(bGrid, segmentWidth * 2, [0.15, 0.5, 1.0]);

    // Draw dividers
    for (let y = 0; y < targetHeight; y++) {
      const idx1 = (y * targetWidth + segmentWidth) * 4;
      const idx2 = (y * targetWidth + segmentWidth * 2) * 4;
      scopeData[idx1] = 64; scopeData[idx1+1] = 64; scopeData[idx1+2] = 64; scopeData[idx1+3] = 255;
      scopeData[idx2] = 64; scopeData[idx2+1] = 64; scopeData[idx2+2] = 64; scopeData[idx2+3] = 255;
    }

    return scopeData;
  }

  /**
   * GENERATE VECTORSCOPE CHART
   * Plots chroma values U vs V (Cb vs Cr) in polar space with targets for prim/sec colors
   */
  public generateVectorscope(
    rgbaData: Uint8ClampedArray,
    imgWidth: number,
    imgHeight: number,
    targetWidth: number = 256,
    targetHeight: number = 256
  ): Uint8ClampedArray {
    const scopeData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    
    // Draw radar background grids (Circles at 38% and 75% saturation thresholds)
    this.drawRadarBackground(scopeData, targetWidth, targetHeight);

    const centerX = targetWidth / 2;
    const centerY = targetHeight / 2;
    const maxRadius = targetWidth * 0.42;

    const totalPixels = imgWidth * imgHeight;
    const step = Math.max(1, Math.floor(totalPixels / 8000)); // Sample ~8,000 points for dense but responsive traces

    for (let i = 0; i < totalPixels; i += step) {
      const idx = i * 4;
      const r = rgbaData[idx];
      const g = rgbaData[idx + 1];
      const b = rgbaData[idx + 2];

      // Convert RGB to YCbCr components (ITU-R BT.601)
      const u = -0.168736 * r - 0.331264 * g + 0.5 * b; // Cb channel offset
      const v = 0.5 * r - 0.418688 * g - 0.081312 * b; // Cr channel offset

      // Scale vectors to scope canvas coordinates
      const scopeX = centerX + (u / 128) * maxRadius;
      const scopeY = centerY - (v / 128) * maxRadius; // invert Y coordinate

      const pX = Math.floor(scopeX);
      const pY = Math.floor(scopeY);

      if (pX >= 0 && pX < targetWidth && pY >= 0 && pY < targetHeight) {
        const plotIdx = (pY * targetWidth + pX) * 4;
        
        // Plot trace with additive luminance glowing pixel
        scopeData[plotIdx] = Math.min(255, scopeData[plotIdx] + 32);     // Red
        scopeData[plotIdx + 1] = Math.min(255, scopeData[plotIdx + 1] + 64); // Green
        scopeData[plotIdx + 2] = Math.min(255, scopeData[plotIdx + 2] + 48); // Blue
        scopeData[plotIdx + 3] = 255;
      }
    }

    return scopeData;
  }

  /**
   * GENERATE HISTOGRAMS (RGB and Luma profiles side-by-side or combined)
   */
  public generateHistogram(
    rgbaData: Uint8ClampedArray,
    targetWidth: number = 256,
    targetHeight: number = 256
  ): Uint8ClampedArray {
    const scopeData = new Uint8ClampedArray(targetWidth * targetHeight * 4);
    this.drawGridBackground(scopeData, targetWidth, targetHeight);

    const rBins = new Uint32Array(256);
    const gBins = new Uint32Array(256);
    const bBins = new Uint32Array(256);
    const lBins = new Uint32Array(256);

    const totalPixels = rgbaData.length / 4;
    const step = Math.max(1, Math.floor(totalPixels / 10000)); // Downsample

    for (let i = 0; i < totalPixels; i += step) {
      const idx = i * 4;
      const r = rgbaData[idx];
      const g = rgbaData[idx + 1];
      const b = rgbaData[idx + 2];
      const l = Math.floor(0.2126 * r + 0.7152 * g + 0.0722 * b);

      rBins[r]++;
      gBins[g]++;
      bBins[b]++;
      lBins[Math.max(0, Math.min(255, l))]++;
    }

    // Find peaks
    let rMax = 1, gMax = 1, bMax = 1, lMax = 1;
    for (let i = 0; i < 256; i++) {
      if (rBins[i] > rMax) rMax = rBins[i];
      if (gBins[i] > gMax) gMax = gBins[i];
      if (bBins[i] > bMax) bMax = bBins[i];
      if (lBins[i] > lMax) lMax = lBins[i];
    }

    const scaleX = targetWidth / 256;

    // Draw lines
    for (let bin = 0; bin < 256; bin++) {
      const xPos = Math.floor(bin * scaleX);

      const rVal = Math.floor((rBins[bin] / rMax) * (targetHeight - 10));
      const gVal = Math.floor((gBins[bin] / gMax) * (targetHeight - 10));
      const bVal = Math.floor((bBins[bin] / bMax) * (targetHeight - 10));
      const lVal = Math.floor((lBins[bin] / lMax) * (targetHeight - 10));

      const drawColumn = (hVal: number, colorIdx: number, valR: number, valG: number, valB: number) => {
        for (let y = targetHeight - 1; y >= targetHeight - hVal; y--) {
          const idx = (y * targetWidth + xPos) * 4;
          scopeData[idx] = Math.max(scopeData[idx], valR);
          scopeData[idx + 1] = Math.max(scopeData[idx + 1], valG);
          scopeData[idx + 2] = Math.max(scopeData[idx + 2], valB);
          scopeData[idx + 3] = 255;
        }
      };

      // Draw channel bars with beautiful additive colors (cyan, magenta, yellow, white overlaps)
      drawColumn(rVal, 0, 255, 0, 0);
      drawColumn(gVal, 1, 0, 255, 0);
      drawColumn(bVal, 2, 0, 0, 255);
      drawColumn(lVal, 3, 220, 220, 220); // Gray luma overlay
    }

    return scopeData;
  }

  // --- BACKGROUND DRAWING GRID UTILITIES ---

  private drawGridBackground(data: Uint8ClampedArray, width: number, height: number): void {
    for (let y = 0; y < height; y++) {
      const isHorizontalGridLine = y === Math.floor(height * 0.1) 
        || y === Math.floor(height * 0.5) 
        || y === Math.floor(height * 0.9);

      for (let x = 0; x < width; x++) {
        const isVerticalGridLine = x === Math.floor(width * 0.25) 
          || x === Math.floor(width * 0.5) 
          || x === Math.floor(width * 0.75);

        const idx = (y * width + x) * 4;
        
        if (isHorizontalGridLine || isVerticalGridLine) {
          data[idx] = 40;     // Grid R
          data[idx + 1] = 40; // Grid G
          data[idx + 2] = 42; // Grid B
        } else {
          data[idx] = 14;     // Canvas slate R
          data[idx + 1] = 14; // Canvas slate G
          data[idx + 2] = 16; // Canvas slate B
        }
        data[idx + 3] = 255; // Alpha
      }
    }
  }

  private drawRadarBackground(data: Uint8ClampedArray, width: number, height: number): void {
    const cx = width / 2;
    const cy = height / 2;
    const radius75 = width * 0.42 * 0.75;
    const radius100 = width * 0.42;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));

        // Draw circles
        const isCircleEdge = Math.abs(dist - radius75) < 1.0 || Math.abs(dist - radius100) < 1.0;
        const isAxisLine = x === cx || y === cy;

        if (isCircleEdge || isAxisLine) {
          data[idx] = 50;
          data[idx + 1] = 50;
          data[idx + 2] = 55;
        } else {
          data[idx] = 12;
          data[idx + 1] = 12;
          data[idx + 2] = 14;
        }
        data[idx + 3] = 255;
      }
    }

    // Plot color coordinates box targets: Red, Yellow, Green, Cyan, Blue, Magenta
    const targets = [
      { name: "R", u: 0.5, v: 0.1, color: [220, 30, 30] },
      { name: "Y", u: 0.12, v: 0.44, color: [200, 200, 20] },
      { name: "G", u: -0.38, v: 0.4, color: [30, 220, 30] },
      { name: "C", u: -0.5, v: -0.1, color: [30, 200, 200] },
      { name: "B", u: -0.12, v: -0.44, color: [30, 30, 240] },
      { name: "M", u: 0.38, v: -0.4, color: [200, 30, 200] }
    ];

    targets.forEach(t => {
      const tX = Math.floor(cx + t.u * radius100);
      const tY = Math.floor(cy - t.v * radius100);

      // Plot small boxes around target positions
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const px = tX + dx;
          const py = tY + dy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const plotIdx = (py * width + px) * 4;
            data[plotIdx] = t.color[0];
            data[plotIdx + 1] = t.color[1];
            data[plotIdx + 2] = t.color[2];
            data[plotIdx + 3] = 255;
          }
        }
      }
    });
  }
}
