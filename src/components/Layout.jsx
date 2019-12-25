import React from "react";
import { Pane } from "evergreen-ui";

export default ({ children }) => {
  return (
    <div className="main-layout">
      <Pane
        padding={24}
        marginBottom={24}
        style={{ background: "var(--charcoal)" }}
      />
      {children}
    </div>
  );
};
