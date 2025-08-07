import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MatrixView from "./components/MatrixView";
import "./index.css";

// Render the application with React Router. The root path and any other path 
// will display the MatrixView. The old dashboard is omitted since MatrixView 
// is now the primary interface.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode> {/* Enable development checks:contentReference[oaicite:1]{index=1} */}
    <BrowserRouter>
      <Routes>
        {/* MatrixView is shown at root and for any unrecognized path */}
        <Route path="/" element={<MatrixView />} />
        <Route path="*" element={<MatrixView />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);