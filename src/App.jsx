import React from "react";
import useLocalStorage from "react-use/esm/useLocalStorage";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./components/Home";

function App() {
  const [token, setToken] = useLocalStorage("ghviz:token", "");

  return (
    <Router>
      <Layout token={token} setToken={setToken}>
        <Route
          path="/"
          exact
          render={props => (
            <Home {...props} token={token} setToken={setToken} />
          )}
        />
      </Layout>
    </Router>
  );
}

export default App;
