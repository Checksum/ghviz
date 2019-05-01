import React from "react";
import { Dialog, TextInputField } from "evergreen-ui";

export default function TokenModal({ setToken }) {
  const [token, onTokenChange] = React.useState("");
  const [cancelled, setCancelled] = React.useState(false);

  const onOk = e => {
    e && e.preventDefault();
    if (token) {
      setCancelled(false);
      setToken(token);
    } else {
      setCancelled(true);
    }
  };

  return (
    <Dialog
      title="Enter a GitHub personal access token"
      isShown={true}
      onConfirm={() => onOk()}
      confirmLabel="Save"
      hasCancel={false}
      onCancel={() => setCancelled(true)}
      preventBodyScrolling={true}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEscapePress={false}
    >
      <p>
        The app needs a personal access token for API requests. If you don't
        have a token, you can{" "}
        <a
          href="https://github.com/settings/tokens/new?description=ghviz&scopes=public_repo,read:org,read:discussion"
          target="_blank"
        >
          create one now
        </a>
      </p>
      <form onSubmit={onOk}>
        <TextInputField
          label="Personal access token"
          onChange={e => onTokenChange(e.currentTarget.value)}
          required
          isInvalid={cancelled && !token}
          validationMessage={
            cancelled && !token && "Access token cannot be empty"
          }
        />
      </form>
    </Dialog>
  );
}
