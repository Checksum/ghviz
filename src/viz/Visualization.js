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
            <Alert intent="danger" title={error.toString()} />
          </Pane>
        );
      }

      return (
        <>
          {!ready || loading ? (
            <Pane
              display="flex"
              alignItems="center"
              justifyContent="center"
              height={400}
            >
              <Spinner size={64} />
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
