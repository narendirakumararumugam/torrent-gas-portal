import { useCallback, useEffect, useState } from 'react';
import { runReport } from '../utils/reportEngine';
import { useDebouncedValue } from './useDebouncedValue';

const RUN_DELAY_MS = 500;

/* Simulates POST /api/reports/run - debounces filter changes for "live preview" */
export function useReportRun(type, params) {
  const debouncedParams = useDebouncedValue(params, 450);
  const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'ready'
  const [result, setResult] = useState(null);
  const [errorFlag, setErrorFlag] = useState(false);

  const execute = useCallback(
    (forceError = false) => {
      setStatus('loading');
      setErrorFlag(forceError);
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

  return { status, result, retry, simulateError, isErrorSimulated: errorFlag };
}
