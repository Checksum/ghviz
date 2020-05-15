import React from "react";
import * as _ from "lodash";
import {
  SearchInput,
  Tablist,
  SidebarTab,
  Pane,
  Heading,
  Text,
  Icon,
} from "../../lib/vendor";

import { fetch } from "../Api";
import HierarchyDiagram from "../viz/HierarchyDiagram";
import ChordDiagram from "../viz/ChordDiagram";

const TABS = [
  {
    name: "languages",
    description: (
      <Text>
        Hover over a language to see other languages it is frequently used with
      </Text>
    ),
    component: ChordDiagram,
  },
  {
    name: "teams",
    description: <Text>Click on a team to see its members</Text>,
    component: HierarchyDiagram,
    filter: ({ type }) => type === "Organization",
  },
  {
    name: "repos",
    description: <Text>Repositories that you </Text>,
    component: () => <div>Repositories</div>,
    filter: ({ type }) => type === "Organization",
  },
];

const ownerQuery = `
query($owner: String!) {
  repositoryOwner(login: $owner) {
    id
    __typename
  }
}
`;

export default class Home extends React.PureComponent {
  state = {
    org: "",
    type: "",
    selectedIndex: 0,
    visitedTabs: new Set([0]),
  };

  selectTab(index) {
    this.setState(({ visitedTabs }) => ({
      selectedIndex: index,
      visitedTabs: visitedTabs.add(index),
    }));
  }

  onOrgChange = (e) => {
    const owner = e.target.value;
    if (e.key === "Enter" && owner) {
      fetch({
        query: ownerQuery,
        token: this.props.token,
        variables: { owner },
      }).then((res) => {
        const type = res.data.repositoryOwner.__typename;
        this.setState((prevState) => {
          const selectedIndex =
            prevState.type === type ? prevState.selectedIndex : 0;
          return {
            org: owner,
            type,
            visitedTabs: new Set([selectedIndex]),
            selectedIndex: selectedIndex,
          };
        });
      });
    }
  };

  render() {
    const { org, selectedIndex, visitedTabs, type } = this.state;
    const { token } = this.props;
    const icon = type && (type === "Organization" ? "office" : "user");

    return (
      <>
        <Pane
          display="flex"
          alignItems="center"
          justifyContent="center"
          paddingBottom={24}
        >
          <SearchInput
            name="org"
            placeholder="GitHub Organization or User"
            width={360}
            height={48}
            required
            onKeyDown={this.onOrgChange}
          />
          {icon && (
            <Icon icon={icon} size={24} style={{ marginLeft: "10px" }} />
          )}
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
                  textTransform: "uppercase",
                }}
                disabled={tab.filter ? !tab.filter(this.state) : false}
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
