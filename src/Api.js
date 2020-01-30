export default function makeFetcher({ query, accumulator, token }) {
  return function recursiveFetch(variables = {}, results = {}) {
    return fetch({ token, query, variables }).then(data => {
      return accumulator(results, data).then(merged => {
        const { hasNextPage, endCursor } = merged.pageInfo || {};
        if (hasNextPage) {
          return recursiveFetch(
            {
              ...variables,
              endCursor
            },
            merged.results
          );
        }
        return merged.results;
      });
    });
  };
}

export function fetch({ token, query, variables }) {
  return window
    .fetch("https://api.github.com/graphql", {
      method: "POST",
      body: JSON.stringify({
        query,
        variables
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json());
}
