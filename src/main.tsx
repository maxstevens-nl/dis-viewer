import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema } from "./schema.ts";

const cacheURL = import.meta.env.VITE_PUBLIC_ZERO_CACHE_URL;
const userID = "public";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ZeroProvider {...{ userID, cacheURL, schema }}>
      <App />
    </ZeroProvider>
  </StrictMode>
);
