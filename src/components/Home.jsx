import React from "react";
import * as _ from "lodash";
import {
  SearchInput,
  Tablist,
  SidebarTab,
  Pane,
  Heading,
  Text
} from "evergreen-ui";

import TokenModal from "./TokenModal";
import HierarchyDiagram from "../viz/HierarchyDiagram";
import ChordDiagram from "../viz/ChordDiagram";

const TABS = [
  {
    name: "teams",
    description: <Text>Click on a team to see its members</Text>,
    component: HierarchyDiagram
  },
  {
    name: "languages",
    description: (
      <Text>
        Hover over a language to see other languages it is frequently used with
      </Text>
    ),
    component: ChordDiagram
  },
  {
    name: "repos",
    description: <Text>Repositories you contribute to</Text>,
    component: () => <div>Repositories</div>
  }
];

export default class Home extends React.PureComponent {
  state = {
    org: "",
    selectedIndex: 0,
    visitedTabs: new Set([0])
  };

  selectTab(index) {
    this.setState(({ visitedTabs }) => ({
      selectedIndex: index,
      visitedTabs: visitedTabs.add(index)
    }));
  }

  onOrgChange = e => {
    if (e.key === "Enter" && e.target.value) {
      this.setState({
        org: e.target.value,
        visitedTabs: new Set([this.state.selectedIndex])
      });
    }
  };

  render() {
    const { org, selectedIndex, visitedTabs } = this.state;
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
            placeholder="GitHub organization"
            width={480}
            height={48}
            required
            onKeyDown={this.onOrgChange}
          />
        </Pane>
        <Pane display="flex" flex="1">
          <Tablist flexBasis={240}>
            {TABS.map((tab, index) => (
              <SidebarTab
                key={tab.name}
                id={tab.name}
                onSelect={() => this.selectTab(index)}
                isSelected={index === selectedIndex}
                aria-controls={`panel-${tab.name}`}
                style={{
                  padding: "24px",
                  fontSize: "0.8em",
                  textTransform: "uppercase"
                }}
              >
                {_.capitalize(tab.name)}
              </SidebarTab>
            ))}
          </Tablist>
          <Pane background="tint1" flex="1" style={{ textAlign: "center" }}>
            {TABS.map((tab, index) => (
              <Pane
                key={tab.name}
                id={`panel-${tab.name}`}
                role="tabpanel"
                aria-labelledby={tab.name}
                aria-hidden={index !== selectedIndex}
                display={index === selectedIndex ? "block" : "none"}
                style={{ position: "relative", height: "100%" }}
                paddingX={24}
              >
                <Pane paddingY={16} style={{ textAlign: "left" }}>
                  <Heading size={600}>{_.capitalize(tab.name)}</Heading>
                  {tab.description || null}
                </Pane>
                {org &&
                  visitedTabs.has(index) &&
                  React.createElement(tab.component, { org, token })}
              </Pane>
            ))}
          </Pane>
        </Pane>
      </>
    );
  }
}
