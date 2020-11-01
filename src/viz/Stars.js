import React from "react";
import { get } from "lodash";

import makeFetcher from "../Api";
import visualization from "./Visualization";

const query = `
query ViewerStars($endCursor: String) {
  viewer {
    starredRepositories(first: 100, after: $endCursor,orderBy: {field: STARRED_AT, direction: DESC}) {
      nodes {
        nameWithOwner
        languages(first: 100) {
          nodes {
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
`;

class ViewerStars extends React.Component {
  node = null;
  state = {
    languageSet: {},
    selectedIndex: -1,
    showDetails: false,
  };

  constructor(props) {
    super(props);
    this.fetcher = makeFetcher({
      query: languagesQuery,
      accumulator: this.onFetchStep,
      token: props.token,
    });
  }

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate(prevProps) {
    if (this.props.org !== prevProps.org) {
      this.setState({ languageSet: {} }, () => {
        this.fetch();
      });
    }
  }

  fetch = () => {
    return this.props
      .fetch(() =>
        this.fetcher({ org: this.props.org }, this.state.languageSet)
      )
      .then((languageSet) => {
        if (languageSet) {
          this.onFetchEnd(languageSet);
        }
      });
  };

  onFetchStep = (acc, data) => {
    return new Promise((resolve, reject) => {
      try {
        const stepResults = processResponse(acc, data);
        this.draw(stepResults);

        resolve({
          results: stepResults,
          pageInfo: _.get(data, "data.repositoryOwner.repositories.pageInfo"),
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  onFetchEnd = (languageSet) => {
    this.setState(
      {
        languageSet,
      },
      () => {
        this.draw(languageSet);
      }
    );
  };
}
