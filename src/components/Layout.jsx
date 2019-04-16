import React from "react";
import { Layout, Menu } from "antd";

const { Header, Content, Footer } = Layout;

export default ({ children }) => {
  return (
    <Layout className="layout" style={{ minHeight: "100vh" }}>
      <Header>
        <Menu theme="dark" mode="horizontal" style={{ lineHeight: "48px" }} />
      </Header>

      <Content
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          background: "white"
        }}
      >
        {children}
      </Content>

      <Footer
        theme="light"
        style={{ textAlign: "center", padding: "10px 50px" }}
      >
        <a href="https://github.com/Checksum/ghviz" target="_blank">
          GitHub
        </a>
      </Footer>
    </Layout>
  );
};
