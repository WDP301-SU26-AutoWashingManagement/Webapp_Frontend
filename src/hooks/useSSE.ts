import { useEffect, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export function useSSE<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed'>('connecting');

  useEffect(() => {
    const ctrl = new AbortController();
    const token = localStorage.getItem('accessToken');

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    setStatus('connecting');

    fetchEventSource(url, {
      headers,
      signal: ctrl.signal,
      async onopen(response) {
        if (response.ok) {
          setStatus('open');
        } else {
          setStatus('connecting');
          throw new Error(`Failed to establish connection: ${response.status}`);
        }
      },
      onmessage(event) {
        try {
          const parsed: T = JSON.parse(event.data);
          setData(parsed);
        } catch (err) {
          console.error("SSE parse error", err);
        }
      },
      onerror(err) {
        setError(err);
        setStatus('connecting');
      },
      onclose() {
        setStatus('closed');
      }
    }).catch((err) => {
      // Don't log abort error as a red error since it's user-initiated on unmount
      if (err.name !== 'AbortError') {
        console.error("SSE connection terminated:", err);
      }
    });

    return () => {
      ctrl.abort();
      setStatus('closed');
    };
  }, [url]);

  return { data, error, status };
}