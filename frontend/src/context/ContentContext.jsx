import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  const [content, setContent] = useState({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(
    () =>
      api
        .get("/content")
        .then((r) => setContent(r.data || {}))
        .catch(() => {})
        .finally(() => setLoaded(true)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => ({ content, loaded, refresh: load }), [content, loaded, load]);

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext) || { content: {}, loaded: false, refresh: () => {} };
