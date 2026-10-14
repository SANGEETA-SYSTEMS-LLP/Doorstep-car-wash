import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api/apiClient";
export default function useApi(url) {
  const [state, setState] = useState({ url, data: null, error: "" });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    const abort = new AbortController();
    apiRequest(url, { signal: abort.signal }).then(data => setState({ url, data, error: "" })).catch(error => {
      if (!abort.signal.aborted) setState({ url, data: null, error: error.message });
    });
    return () => abort.abort();
  }, [url, version]);
  return { data: state.url === url ? state.data : null, error: state.url === url ? state.error : "", loading: state.url !== url || (!state.data && !state.error), refresh };
}
