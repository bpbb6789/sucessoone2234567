import React from "react";
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from "@apollo/client";

const httpLink = new HttpLink({
  uri: "https://unipump-contracts.onrender.com/graphql"
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          uniPumpCreatorSaless: {
            merge(existing = { items: [] }, incoming: any) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}
