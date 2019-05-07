import React from "react";
import * as _ from "lodash";
import { SearchInput, Tablist, Tab, Pane, Paragraph } from "evergreen-ui";

import TokenModal from "./TokenModal";
import HierarchyDiagram from "../viz/HierarchyDiagram";
import ChordDiagram from "../viz/ChordDiagram";

const tabs = ["teams", "languages", "repos"];
const components = {
  teams: HierarchyDiagram,
  languages: ChordDiagram,
  repos: () => <div>Repositories</div>
};

export default class Home extends React.PureComponent {
  state = {
    org: "",
    selectedIndex: 0
  };

  selectTab(index) {
    this.setState({ selectedIndex: index });
  }

  onOrgChange = e => {
    if (e.key === "Enter" && e.target.value) {
      this.setState({ org: e.target.value });
    }
  };

  render() {
    const { org, selectedIndex } = this.state;
    const { token, setToken } = this.props;

    return !token ? (
      <TokenModal setToken={setToken} />
    ) : (
      <>
        <Pane
          display="flex"
          alignItems="center"
          justifyContent="center"
          paddingBottom={24}
        >
          <SearchInput
            name="org"
            placeholder="Organization handle"
            width={480}
            height={48}
            required
            onKeyDown={this.onOrgChange}
          />
        </Pane>
        <Pane
          display="flex"
          alignItems="center"
          justifyContent="center"
          paddingBottom={24}
        >
          <Tablist>
            {tabs.map((tab, index) => (
              <Tab
                key={tab}
                id={tab}
                onSelect={() => this.selectTab(index)}
                isSelected={index === selectedIndex}
                style={{
                  padding: "20px 32px",
                  fontSize: "0.8em",
                  textTransform: "uppercase"
                }}
              >
                {_.capitalize(tab)}
              </Tab>
            ))}
          </Tablist>
        </Pane>
        <Pane background="tint1" flex="1" style={{ textAlign: "center" }}>
          {tabs.map((tab, index) => (
            <Pane
              key={tab}
              id={`panel-${tab}`}
              role="tabpanel"
              aria-labelledby={tab}
              aria-hidden={index !== selectedIndex}
              display={index === selectedIndex ? "block" : "none"}
              style={{ position: "relative", height: "100%" }}
            >
              {org && React.createElement(components[tab], { org, token })}
            </Pane>
          ))}
        </Pane>
      </>
    );
  }
}
