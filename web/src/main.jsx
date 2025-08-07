import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import MatrixView from "./components/MatrixView";
import "./index.css";

// Render the application with React Router.  The `/matrix` path loads the
// matrix view, while all other paths (including root) fall back to the
// existing dashboard.
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/matrix" element={<MatrixView />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
