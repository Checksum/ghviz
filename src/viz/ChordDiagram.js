import React from "react";
import * as d3 from "d3";
import * as _ from "lodash";
import * as fp from "lodash/fp";
import { Spin, Alert, Row, Col } from "antd";

import makeFetcher from "../Api";

const orgLanguages = `
query($org: String!, $count: Int = 100, $endCursor: String) {
  organization(login: $org) {
    repositories(first: $count, after: $endCursor) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        languages(first: 5) {
          nodes {
            id
            name
            color
          }
        }
      }
    }
  }
}
`;

function processResponse(languageSet, data) {
  const repos = _.get(data, "data.organization.repositories.nodes", []);
  if (repos.length === 0) {
    throw new Error("No repos found or insufficient permission");
  }

  return fp.flow(
    fp.map("languages.nodes"),
    fp.reduce((acc, languages) => {
      let {
        indexByName = new Map(),
        nameByIndex = new Map(),
        matrix = []
      } = acc;
      let n = matrix.length;

      languages.forEach(lang => {
        if (!indexByName.has(lang.name)) {
          nameByIndex.set(n, lang);
          indexByName.set(lang.name, n++);
        }
      });

      // since new languages could've been added in this
      // reduce step (which means n would've increased),
      // pad the existing matrix entries with 0's upto n
      matrix = matrix.map(row =>
        row.length < n
          ? [
              ...row,
              ...Array.from({
                length: n - row.length
              }).fill(0)
            ]
          : row
      );

      languages.forEach(lang => {
        const source = indexByName.get(lang.name);
        let row = matrix[source];
        if (!row) {
          row = matrix[source] = Array.from({ length: n }).fill(0);
        }

        languages
          .filter(l => l.name != lang.name)
          .forEach(target => row[indexByName.get(target.name)]++);
      });

      return {
        indexByName,
        nameByIndex,
        matrix
      };
    }, languageSet)
  )(repos);
}

export default class ChordDiagram extends React.Component {
  node = null;
  state = {
    loading: false,
    hasError: false,
    errorMessage: "",
    languageSet: {}
  };

  constructor(props) {
    super(props);
    this.fetcher = makeFetcher(orgLanguages, this.onFetch);
  }

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.org !== prevProps.org) {
      this.setState({ languageSet: {} }, () => {
        this.fetch();
      });
    }
  }

  componentDidCatch(error) {
    this.onError(error);
  }

  onError = error => {
    console.error(error);
    this.setState({
      hasError: true,
      errorMessage: error.toString()
    });
  };

  onFetch = (acc, data) => {
    return new Promise((resolve, reject) => {
      try {
        const stepResults = processResponse(acc, data);
        this.draw(stepResults);

        resolve({
          results: stepResults,
          pageInfo: _.get(data, "data.organization.repositories.pageInfo")
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  fetch() {
    const { org } = this.props;
    this.setState({ loading: true, hasError: false });

    this.fetcher({ org }, this.state.languageSet)
      .then(languageSet => {
        this.setState({
          languageSet,
          loading: false
        });
        this.draw(languageSet);
      })
      .catch(this.onError);
  }

  draw(data) {
    if (!this.node) {
      return;
    }
    const width = 800;
    const height = 800;
    const outerRadius = Math.min(width, height) * 0.5;
    const innerRadius = outerRadius - 124;

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const ribbon = d3.ribbon().radius(innerRadius);

    const arc = d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(innerRadius + 20);

    const chord = d3
      .chord()
      .padAngle(0.04)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

    // const svg = d3
    //   .select(this.el)
    //   .append("svg")
    //   .attr("viewBox", [-width / 2, -height / 2, width, height])
    //   .attr("font-size", 10)
    //   .attr("font-family", "sans-serif")
    //   .style("width", width + "px")
    //   .style("height", height + "px");
    // .style("width", "100%")
    // .style("height", "auto");

    const svg = this.node;
    const chords = chord(data.matrix);

    svg.selectAll("*").remove();

    const group = svg
      .append("g")
      .selectAll("g")
      .data(chords.groups)
      .join("g");

    group
      .append("path")
      .attr("fill", d => data.nameByIndex.get(d.index).color)
      .attr("stroke", d => data.nameByIndex.get(d.index).color)
      // .attr("stroke", d => color(d.index))
      .attr("d", arc);

    group
      .append("text")
      .each(d => {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr("dy", ".35em")
      .attr(
        "transform",
        d => `
          rotate(${(d.angle * 180) / Math.PI - 90})
          translate(${innerRadius + 26})
          ${d.angle > Math.PI ? "rotate(180)" : ""}
        `
      )
      .attr("text-anchor", d => (d.angle > Math.PI ? "end" : null))
      .text(d => data.nameByIndex.get(d.index).name);

    const connections = svg
      .append("g")
      .attr("fill-opacity", 0.67)
      .selectAll("path")
      .data(chords)
      .join("path");

    connections
      .attr(
        "stroke",
        d => d3.rgb(data.nameByIndex.get(d.source.index).color).darker()
        // d3.rgb(color(d.source.index)).darker()
      )
      .attr("fill", d => data.nameByIndex.get(d.source.index).color)
      // .attr("stroke", d =>
      //   d3.rgb(color(d.source.index)).darker()
      // )
      // .attr("fill", d => color(d.source.index))
      .attr("d", ribbon);

    group
      .on("mouseover", section => {
        connections.style("visibility", d =>
          d.source.index === section.index ? "visible" : "hidden"
        );
      })
      .on("mouseout", d => {
        connections.style("visibility", "visible");
      });
  }

  render() {
    const { loading, hasError, errorMessage } = this.state;
    const width = 800;
    const height = 800;

    if (hasError) {
      return (
        <Row>
          <Col span={8} offset={8}>
            <Alert message={errorMessage} type="error" />
          </Col>
        </Row>
      );
    }

    if (loading) {
      return (
        <div style={{ textAlign: "center", marginTop: "20vh" }}>
          <Spin size="large" />
        </div>
      );
    }

    return (
      <svg
        ref={node => (this.node = d3.select(node))}
        viewBox={[-width / 2, -height / 2, width, height].join(" ")}
        fontSize="10px"
        fontFamily="sans-serif"
        width={width + "px"}
        height={height + "px"}
      />
    );
  }
}
