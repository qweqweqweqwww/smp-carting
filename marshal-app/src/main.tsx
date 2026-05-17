import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MarshalProvider } from "./contexts/MarshalContext";
import { JoinPage } from "./pages/JoinPage";
import { RecordPage } from "./pages/RecordPage";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MarshalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/join/:token" element={<JoinPage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="*" element={<Navigate to="/record" replace />} />
          </Routes>
        </BrowserRouter>
      </MarshalProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
