import React, { useEffect, useState } from "react";
import { Pane, Avatar, Heading } from "evergreen-ui";

import { fetch } from "../Api";
import TokenModal from "./TokenModal";

const viewerQuery = `
query {
  viewer {
    login
    name
    avatarUrl
  }
}
`;

export default ({ children, token, setToken }) => {
  const [viewer, setViewer] = useState({});
  useEffect(() => {
    if (viewer.login) {
      return;
    }
    fetch({ query: viewerQuery, token })
      .then(res => {
        setViewer(_old => res.data.viewer);
      })
      .catch(err => {
        console.error(err);
      });
  }, [viewer]);

  return !token ? (
    <TokenModal setToken={setToken} />
  ) : (
    <div className="main-layout">
      <Pane
        display="flex"
        padding={8}
        marginBottom={24}
        style={{ background: "var(--charcoal)" }}
      >
        <Pane flex={1} alignItems="center" display="flex">
          <Heading size={600} style={{ color: "#eee" }}>
            GHviz
          </Heading>
        </Pane>
        <Pane>
          {viewer.name && (
            <Avatar name={viewer.name} src={viewer.avatarUrl} size={36} />
          )}
        </Pane>
      </Pane>
      {children}
    </div>
  );
};
