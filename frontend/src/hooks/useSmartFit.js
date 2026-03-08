import { useMemo } from 'react';
import { normalizeMeasurements, calculateFitScore } from '../lib/size-engine';

export const useSmartFit = (productRawData, userProfile, category) => {
  
  const productMetrics = useMemo(() => {
    return normalizeMeasurements(productRawData, category);
  }, [productRawData, category]);

  const userMetrics = useMemo(() => {
    if (!userProfile?.measurements) return null;
    return normalizeMeasurements(userProfile.measurements, category);
  }, [userProfile, category]);

  const result = useMemo(() => {
    return calculateFitScore(userMetrics, productMetrics, category);
  }, [userMetrics, productMetrics, category]);

  return {
    isReady: !!result,
    ...result // score, recommendation, details
  };
};