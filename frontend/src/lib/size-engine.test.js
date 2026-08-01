import { describe, it, expect } from 'vitest';
import { 
  normalizeMeasurements, 
  getStatusColor, 
  calculateFitScore, 
  estimateUserMeasurements, 
  calculateAIFitScore, 
  predictBestSize 
} from './size-engine';

describe('Size Engine Library', () => {
  
  describe('normalizeMeasurements', () => {
    it('should normalize Zara top measurements (chest < 65cm -> doubled)', () => {
      const rawData = {
        chest: '50',
        shoulder: '40',
        length: '70'
      };
      
      const normalized = normalizeMeasurements(rawData, 'top');
      
      expect(normalized).toBeDefined();
      expect(normalized.chest).toBe(100); // 50 * 2
      expect(normalized.shoulder).toBe(40);
      expect(normalized.length).toBe(70);
      expect(normalized.waist).toBe(90); // default calculation 100 * 0.90
    });

    it('should not double if chest is already > 65cm', () => {
      const rawData = {
        chest: '100',
        shoulder: '40',
        length: '70'
      };
      
      const normalized = normalizeMeasurements(rawData, 'top');
      
      expect(normalized.chest).toBe(100);
    });

    it('should handle bottom category correctly', () => {
      const rawData = {
        waist: '40', // will be doubled
        outseam: '100'
      };
      
      const normalized = normalizeMeasurements(rawData, 'bottom');
      
      expect(normalized.waist).toBe(80); // 40 * 2
      expect(normalized.hip).toBe(94); // default: 80 * 1.18 = 94.4 -> 94
      expect(normalized.outseam).toBe(100);
    });
  });

  describe('getStatusColor', () => {
    it('should return Perfect for diff <= 2', () => {
      const res = getStatusColor(1);
      expect(res.status).toBe('Perfect Fit');
      expect(res.color).toBe('#10b981');
    });

    it('should return Too Tight for diff < -5', () => {
      const res = getStatusColor(-6);
      expect(res.status).toBe('Too Tight');
      expect(res.color).toBe('#ef4444');
    });
  });

  describe('predictBestSize', () => {
    it('should return the size with the highest fit score', () => {
      const userProfile = {
        measurements: {
          chest: 100,
          waist: 90,
          shoulder: 45,
          arm: 60
        },
        preferences: {
          default_fit: 'regular'
        }
      };

      const availableSizes = [
        { size: 'S', measurements: { chest: 90, waist: 80, shoulder: 40, arm: 55 } },
        { size: 'M', measurements: { chest: 102, waist: 92, shoulder: 46, arm: 61 } }, // Perfect match
        { size: 'L', measurements: { chest: 110, waist: 100, shoulder: 50, arm: 65 } }
      ];

      const result = predictBestSize(userProfile, availableSizes, 'top');
      
      expect(result).not.toBeNull();
      expect(result.size).toBe('M');
      expect(result.score).toBeGreaterThan(90); // Should be a very high score
    });
  });
});
