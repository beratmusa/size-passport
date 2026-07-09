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
    const preference = userProfile?.preferences?.default_fit || 'regular';
    return calculateFitScore(userMetrics, productMetrics, category, preference);
  }, [userMetrics, productMetrics, category, userProfile]);

  return {
    isReady: !!result,
    ...result // score, recommendation, details
  };
};