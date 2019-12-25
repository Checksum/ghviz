import React from "react";
import { Alert, Pane } from "evergreen-ui";

export default function visualization(WrappedComponent) {
  class Visualization extends React.PureComponent {
    state = {
      loading: false,
      ready: true,
      error: null,
      d3: null
    };

    constructor(props) {
      super(props);
      this.wrapped = React.createElement(WrappedComponent, {
        setLoading: this.setLoading,
        resetError: this.resetError,
        onError: this.onError,
        fetch: this.fetch
      });
    }

    componentDidMount() {
      import("../../lib/d3").then(d3 => {
        this.setState({ d3 });
      });
    }

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

    fetch = fetcher => {
      this.resetError();
      this.setLoading(true);
      return fetcher()
        .then(res => {
          this.setLoading(false);
          return res;
        })
        .catch(this.onError);
    };

    render() {
      const { d3, loading, ready, error } = this.state;

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
              display="flex"
              alignItems="center"
              justifyContent="center"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                background: "rgba(0, 0, 0, 0.15)",
                zIndex: 10
              }}
            >
              <div className="spinner" style={{ top: "-10%" }}>
                <div className="double-bounce1" />
                <div className="double-bounce2" />
              </div>
            </Pane>
          ) : null}
          {React.cloneElement(this.wrapped, {
            ...this.props,
            d3,
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
