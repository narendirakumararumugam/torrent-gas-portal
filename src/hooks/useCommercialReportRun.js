import { useCallback, useEffect, useState } from 'react';
import { runReport } from '../utils/commercialReportEngine';
import { useDebouncedValue } from './useDebouncedValue';

const RUN_DELAY_MS = 500;

export function useCommercialReportRun(type, params) {
  const debouncedParams = useDebouncedValue(params, 450);
  const [status, setStatus] = useState('loading');
  const [result, setResult] = useState(null);

  const execute = useCallback(
    (forceError = false) => {
      setStatus('loading');
      const timer = setTimeout(() => {
        if (forceError) {
          setStatus('error');
          return;
        }
        setResult(runReport(type, debouncedParams));
        setStatus('ready');
      }, RUN_DELAY_MS);
      return () => clearTimeout(timer);
    },
    [type, debouncedParams],
  );

  useEffect(() => execute(false), [execute]);

  const retry = () => execute(false);
  const simulateError = () => execute(true);

  return { status, result, retry, simulateError };
}