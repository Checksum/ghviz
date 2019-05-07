import React from "react";
import { Alert, Spinner, Pane } from "evergreen-ui";

export default function visualization(WrappedComponent) {
  class Visualization extends React.PureComponent {
    state = {
      loading: false,
      ready: true,
      error: null
    };

    constructor(props) {
      super(props);
      this.wrapped = React.createElement(WrappedComponent, {
        setLoading: this.setLoading,
        resetError: this.resetError,
        onError: this.onError
      });
    }

    // componentDidMount() {
    //   // import("../../lib/d3").then(() => this.setState({ ready: true }));
    // }

    componentDidUpdate(nextProps, nextState) {
      if (nextProps.org !== this.props.org) {
        this.resetError();
      }
    }

    componentDidCatch(error) {
      this.onError(error);
    }

    onError = error => {
      console.error(error);
      this.setState({
        error
      });
    };

    setLoading = loading => {
      this.setState({ loading });
    };

    resetError = () => {
      this.setState({ error: null });
    };

    render() {
      const { loading, ready, error } = this.state;

      if (error) {
        return (
          <Pane
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={320}
          >
            <Alert
              appearance="card"
              intent="danger"
              title={error.toString().replace(/^error:\s?/i, "")}
            />
          </Pane>
        );
      }

      return (
        <>
          {!ready || loading ? (
            <Pane
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(0, 0, 0, 0.1)"
              }}
            >
              <Spinner size={64} marginX="auto" marginY="20%" />
            </Pane>
          ) : null}
          {React.cloneElement(this.wrapped, {
            ...this.props,
            loading,
            error
          })}
        </>
      );
    }
  }

  Visualization.displayName = `Visualization(${getDisplayName(
    WrappedComponent
  )})`;

  return Visualization;
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
