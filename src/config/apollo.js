import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Create an HTTP link
const httpLink = createHttpLink({
  uri: "https://dry-sands-56701.herokuapp.com/",
});

// Create an auth link to include authorization headers
const authLink = setContext((_, { headers }) => {
  // Add any authorization logic here, e.g., token retrieval from local storage
  const token = localStorage.getItem("token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Create ApolloClient instance
const client = new ApolloClient({
  link: authLink.concat(httpLink), // Use the auth link with the HTTP link
  cache: new InMemoryCache(),
  connectToDevTools: true, // Enable Apollo DevTools for debugging
});

export default client;
