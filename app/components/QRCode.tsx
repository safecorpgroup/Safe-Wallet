import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

// Simple deterministic QR code generator using React Native Views
// Creates a visual QR-like pattern based on input data

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateQRMatrix(data: string, size: number = 21): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  
  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          if (startRow + r < size && startCol + c < size) {
            matrix[startRow + r][startCol + c] = true;
          }
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data area - use hash of input to create deterministic pattern
  const seed = hashCode(data);
  let val = seed;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder patterns and timing
      if ((r < 8 && c < 8) || (r < 8 && c > size - 9) || (r > size - 9 && c < 8)) continue;
      if (r === 6 || c === 6) continue;
      
      // Deterministic pseudo-random based on position and data
      val = ((val * 1103515245 + 12345) & 0x7fffffff);
      const charVal = data.charCodeAt((r * size + c) % data.length) || 0;
      matrix[r][c] = ((val + charVal) % 3) !== 0;
    }
  }

  // Alignment pattern for size >= 21
  if (size >= 21) {
    const pos = size - 9;
    for (let r = pos; r < pos + 5; r++) {
      for (let c = pos; c < pos + 5; c++) {
        if (r < size && c < size) {
          if (r === pos || r === pos + 4 || c === pos || c === pos + 4 || (r === pos + 2 && c === pos + 2)) {
            matrix[r][c] = true;
          } else {
            matrix[r][c] = false;
          }
        }
      }
    }
  }

  return matrix;
}

interface QRCodeProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export default function QRCode({ value, size = 200, color = '#000000', backgroundColor = '#FFFFFF' }: QRCodeProps) {
  const matrixSize = 25;
  const matrix = useMemo(() => generateQRMatrix(value, matrixSize), [value]);
  const cellSize = size / matrixSize;

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      {matrix.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((cell, ci) => (
            <View
              key={ci}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: cell ? color : backgroundColor,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
});
