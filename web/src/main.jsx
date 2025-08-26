import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import HeatmapView from "./components/HeatmapView";
import MatrixView from "./components/MatrixView";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/heatmap" element={<HeatmapView />} />
        <Route path="/matrix" element={<MatrixView />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);