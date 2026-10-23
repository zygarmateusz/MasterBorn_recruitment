// usePriceCalculation Hook
// Marcus: "This hook handles async price fetching. A bit janky but works."

import { useState, useEffect, useCallback } from 'react';
import type {
  Configuration,
  Product,
  PriceBreakdown,
} from '../components/ProductConfigurator/types';
import { calculatePrice } from '../services/api';

interface UsePriceCalculationResult {
  price: PriceBreakdown | null;
  formattedTotal: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface PriceResult {
  config: Configuration;
  attempt: number;
  price: PriceBreakdown | null;
  formattedTotal: string;
  error: string | null;
}

/**
 * Custom hook for managing price calculation
 */
export function usePriceCalculation(
  config: Configuration | null,
  product: Product,
): UsePriceCalculationResult {
  const [result, setResult] = useState<PriceResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!config) return;

    let ignore = false;

    calculatePrice(config, product)
      .then((response) => {
        if (!ignore) {
          setResult({
            config,
            attempt,
            price: response.breakdown,
            formattedTotal: response.formattedTotal,
            error: null,
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          setResult((prev) => ({
            config,
            attempt,
            price: null,
            formattedTotal: prev?.formattedTotal ?? '$0.00',
            error: 'ERR_PRICE_CALC_FAILED',
          }));
        }
      });

    return () => {
      ignore = true;
    };
  }, [config, product, attempt]);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  if (!config) {
    return { price: null, formattedTotal: '$0.00', isLoading: false, error: null, refetch };
  }

  return {
    price: result?.price ?? null,
    formattedTotal: result?.formattedTotal ?? '$0.00',
    isLoading: result?.config !== config || result.attempt !== attempt,
    error: result?.error ?? null,
    refetch,
  };
}
