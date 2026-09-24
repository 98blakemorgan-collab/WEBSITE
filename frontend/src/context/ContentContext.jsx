import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  const [content, setContent] = useState({});
  const [loaded, setLoaded] = useState(false);

  const load = () =>
    api
      .get("/content")
      .then((r) => setContent(r.data || {}))
      .catch(() => {})
      .finally(() => setLoaded(true));

  useEffect(() => {
    load();
  }, []);

  return (
    <ContentContext.Provider value={{ content, loaded, refresh: load }}>
      {children}
    </ContentContext.Provider>
  );
}

export const useContent = () => useContext(ContentContext) || { content: {}, loaded: false, refresh: () => {} };
