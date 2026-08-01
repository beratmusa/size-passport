import { useMemo } from 'react';
import { normalizeMeasurements, calculateFitScore } from '../lib/size-engine';

export const useSmartFit = (productRawData, userProfile, category) => {

  const normalizedProduct = useMemo(() => {
    if (!productRawData) return null;
    return normalizeMeasurements(productRawData, category, false);
  }, [productRawData, category]);

  const normalizedUser = useMemo(() => {
    if (!userProfile?.measurements) return null;
    return normalizeMeasurements(userProfile.measurements, category, true);
  }, [userProfile, category]);

  const result = useMemo(() => {
    const preference = userProfile?.preferences?.default_fit || 'regular';
    if (!normalizedProduct || !normalizedUser) return null;
    return calculateFitScore(normalizedUser, normalizedProduct, category, preference);
  }, [normalizedUser, normalizedProduct, category, userProfile]);

  return {
    isReady: !!result,
    ...result // score, recommendation, details
  };
};