import "./style.css";
import "../lib/vendor";

import React from "react";
import ReactDOM from "react-dom";

import("./App").then((AppModule) => {
  const App = AppModule.default;
  ReactDOM.render(<App />, document.querySelector("#root"));
});
