import "../lib/vendor";

import React from "react";
import ReactDOM from "react-dom";

import "normalize.css";
import "./style.css";

import("./App").then(AppModule => {
  const App = AppModule.default;
  ReactDOM.render(<App />, document.querySelector("#root"));
});
