import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MetaTagProvider = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1";
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  return children;
};

export default MetaTagProvider;
