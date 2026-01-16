/**
 * Unit Tests for 1RM Calculator
 * Placeholder tests to ensure math accuracy
 * 
 * TODO: Install testing framework (Vitest/Jest) and implement full test suite
 */

import { describe, it, expect } from 'vitest';
import {
  calculate1RM,
  calculate1RM_Epley,
  calculate1RM_Brzycki,
  calculate1RM_Lombardi,
  calculate1RM_Average
} from '../utils/strengthCalculations';

describe('1RM Calculator', () => {
  describe('calculate1RM_Epley', () => {
    it('should return weight when reps is 1', () => {
      expect(calculate1RM_Epley(100, 1)).toBe(100);
    });

    it('should calculate 1RM for 5 reps at 100kg', () => {
      // Expected: 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
      const result = calculate1RM_Epley(100, 5);
      expect(result).toBeCloseTo(116.67, 2);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculate1RM_Epley(0, 5)).toBe(0);
      expect(calculate1RM_Epley(100, 0)).toBe(0);
      expect(calculate1RM_Epley(-10, 5)).toBe(0);
    });
  });

  describe('calculate1RM_Brzycki', () => {
    it('should return weight when reps is 1', () => {
      expect(calculate1RM_Brzycki(100, 1)).toBe(100);
    });

    it('should calculate 1RM for 5 reps at 100kg', () => {
      // Expected: 100 * (36 / (37 - 5)) = 100 * (36/32) = 112.5
      const result = calculate1RM_Brzycki(100, 5);
      expect(result).toBeCloseTo(112.5, 2);
    });

    it('should handle edge cases', () => {
      expect(calculate1RM_Brzycki(0, 5)).toBe(0);
      expect(calculate1RM_Brzycki(100, 0)).toBe(0);
    });
  });

  describe('calculate1RM_Lombardi', () => {
    it('should return weight when reps is 1', () => {
      expect(calculate1RM_Lombardi(100, 1)).toBe(100);
    });

    it('should calculate 1RM for 5 reps at 100kg', () => {
      // Expected: 100 * (5^0.1) = 100 * 1.1746 = 117.46
      const result = calculate1RM_Lombardi(100, 5);
      expect(result).toBeCloseTo(117.46, 2);
    });
  });

  describe('calculate1RM_Average', () => {
    it('should return average of all three formulas', () => {
      const result = calculate1RM_Average(100, 5);
      const epley = calculate1RM_Epley(100, 5);
      const brzycki = calculate1RM_Brzycki(100, 5);
      const lombardi = calculate1RM_Lombardi(100, 5);
      const expected = (epley + brzycki + lombardi) / 3;
      
      expect(result).toBeCloseTo(expected, 2);
    });
  });

  describe('calculate1RM (default method)', () => {
    it('should use average method by default', () => {
      const defaultResult = calculate1RM(100, 5);
      const averageResult = calculate1RM_Average(100, 5);
      expect(defaultResult).toBeCloseTo(averageResult, 2);
    });

    it('should allow method selection', () => {
      const epleyResult = calculate1RM(100, 5, 'epley');
      const epleyDirect = calculate1RM_Epley(100, 5);
      expect(epleyResult).toBeCloseTo(epleyDirect, 2);
    });
  });
});
