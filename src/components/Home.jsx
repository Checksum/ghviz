import React from "react";
import { Tabs, Input, Row, Col } from "antd";
const { TabPane } = Tabs;
const { Search } = Input;

import TokenModal from "./TokenModal";
import HierarchyDiagram from "../viz/HierarchyDiagram";
import ChordDiagram from "../viz/ChordDiagram";

export default class Home extends React.Component {
  state = { org: "" };

  render() {
    const { token, setToken } = this.props;
    const { org } = this.state;

    return !token ? (
      <TokenModal setToken={setToken} />
    ) : (
      <>
        <Row>
          <Col span={8} offset={8}>
            <Search
              size="large"
              placeholder="Organisation"
              onSearch={org => this.setState({ org })}
              enterButton="Search"
            />
          </Col>
        </Row>
        <Row style={{ flex: "auto" }}>
          <Tabs type="card" onChange={() => null}>
            <TabPane tab="Teams" key="1">
              {org && <HierarchyDiagram org={org} />}
            </TabPane>
            <TabPane tab="Languages" key="2">
              {org && <ChordDiagram org={org} />}
            </TabPane>
          </Tabs>
        </Row>
      </>
    );
  }
}
