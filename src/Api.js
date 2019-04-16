export default function makeFetcher(query, accumulator) {
  return function recursiveFetch(variables = {}, results = {}) {
    let token = localStorage.getItem("ghviz:token");
    try {
      token = JSON.parse(token);
    } catch {}

    return fetch("https://api.github.com/graphql", {
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
      .then(res => res.json())
      .then(data => {
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
