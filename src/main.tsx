import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import DetailRouter from "./pages/DetailRouter.tsx";
import "./index.css";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema } from "./schema.ts";

const cacheURL = import.meta.env.VITE_PUBLIC_ZERO_CACHE_URL;
const userID = "public";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ZeroProvider {...{ userID, cacheURL, schema }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/:id" element={<DetailRouter />} />
        </Routes>
      </BrowserRouter>
    </ZeroProvider>
  </StrictMode>
);
