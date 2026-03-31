import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./app/App";
import { AuthProvider } from "./context/AuthContext";
import { PosDataProvider } from "./context/PosDataContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <PosDataProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PosDataProvider>
    </AuthProvider>
  </React.StrictMode>
);
