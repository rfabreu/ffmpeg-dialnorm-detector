import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MatrixView from "./components/MatrixView";
import "./index.css";

// Render the application with React Router.  The root path and all others
// render the matrix view.  We omit the old dashboard since the matrix view
// is now the primary interface.
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* The matrix view is shown at root and for any unrecognised path */}
      <Route path="/" element={<MatrixView />} />
      <Route path="*" element={<MatrixView />} />
    </Routes>
  </BrowserRouter>
);
