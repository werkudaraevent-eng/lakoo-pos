import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./app/App";
import { AuthProvider } from "./context/AuthContext";
import { PosDataProvider } from "./context/PosDataContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <WorkspaceProvider>
        <PosDataProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PosDataProvider>
      </WorkspaceProvider>
    </AuthProvider>
  </React.StrictMode>
);
