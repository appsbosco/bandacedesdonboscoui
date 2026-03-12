import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import client from "config/apollo";
import { SoftUIControllerProvider } from "context";
import { ToastProvider } from "components/ui/Toast";
import MetaTagProvider from "MetaTagProvider";
import { UserProvider } from "./UserContext";
import App from "App";
import "./i18n";

// ApolloProvider sube al nivel más alto para que UserProvider
// pueda consumir el cache sin un segundo client context.
// ToastProvider y SoftUIControllerProvider no dependen de Apollo
// y no se re-renderizan por queries.
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <MetaTagProvider>
        <SoftUIControllerProvider>
          <ToastProvider>
            <UserProvider>
              <App />
            </UserProvider>
            <ToastContainer />
          </ToastProvider>
        </SoftUIControllerProvider>
      </MetaTagProvider>
    </ApolloProvider>
  </BrowserRouter>
);
