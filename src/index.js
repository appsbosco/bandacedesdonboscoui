import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

// BCDB React Context Provider
import { SoftUIControllerProvider } from "context";
import client from "config/apollo";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserProvider } from "./UserContext";
import MetaTagProvider from "MetaTagProvider";

const rootElement = document.getElementById("root");

const renderApp = () => (
  <BrowserRouter>
    <MetaTagProvider>
      <SoftUIControllerProvider>
        <ApolloProvider client={client}>
          <UserProvider>
            <App />
          </UserProvider>
          <ToastContainer />
        </ApolloProvider>
      </SoftUIControllerProvider>
    </MetaTagProvider>
  </BrowserRouter>
);

createRoot(rootElement).render(renderApp());
