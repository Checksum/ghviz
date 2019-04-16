import React from "react";
import { Modal, Typography, Form, Input } from "antd";
const { Paragraph } = Typography;

export default function TokenModal({ setToken }) {
  const [token, onTokenChange] = React.useState("");
  const [cancelled, setCancelled] = React.useState(false);

  const onOk = () => {
    token && setToken(token);
  };

  return (
    <Modal
      title="Enter a GitHub personal access token"
      visible={true}
      onOk={onOk}
      onCancel={() => setCancelled(true)}
    >
      <Paragraph>
        The app needs a personal access token for API requests. If you don't
        have a token, you can{" "}
        <a
          href="https://github.com/settings/tokens/new?description=ghviz&scopes=public_repo,read:org,read:discussion"
          target="_blank"
        >
          create one now
        </a>
      </Paragraph>
      <Form onSubmit={onOk}>
        <Input
          placeholder="personal access token"
          size="large"
          onChange={e => onTokenChange(e.currentTarget.value)}
          required
        />
      </Form>
      {cancelled && (
        <Paragraph
          type="warning"
          strong
          style={{ marginTop: "1em", marginBottom: "0" }}
        >
          Access token cannot be empty
        </Paragraph>
      )}
    </Modal>
  );
}
