import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

// BCDB React Context Provider
import { SoftUIControllerProvider } from "context";
import client from "config/apollo";

const rootElement = document.getElementById("root");

const renderApp = () => (
  <BrowserRouter>
    <SoftUIControllerProvider>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </SoftUIControllerProvider>
  </BrowserRouter>
);

createRoot(rootElement).render(renderApp());
