import "../lib/vendor";

import React from "react";
import ReactDOM from "react-dom";

import "normalize.css";
import "./style.css";

ReactDOM.render(<p>Loading...</p>, document.querySelector("#root"));

import("./App").then(AppModule => {
  const App = AppModule.default;
  ReactDOM.render(<App />, document.querySelector("#root"));
});
