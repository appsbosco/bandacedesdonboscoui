import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";
import { ApolloProvider } from "@apollo/client";

// Banda CEDES Don Bosco Context Provider
import { SoftUIControllerProvider } from "context";
import client from "config/apollo";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserProvider } from "./UserContext";
import MetaTagProvider from "MetaTagProvider";
import "./i18n";
import { ToastProvider } from "components/ui/Toast";

const rootElement = document.getElementById("root");

const renderApp = () => (
  <BrowserRouter>
    <MetaTagProvider>
      <SoftUIControllerProvider>
        <ToastProvider>
          <ApolloProvider client={client}>
            <UserProvider>
              <App />
            </UserProvider>
            <ToastContainer />
          </ApolloProvider>
        </ToastProvider>
      </SoftUIControllerProvider>
    </MetaTagProvider>
  </BrowserRouter>
);

createRoot(rootElement).render(renderApp());
