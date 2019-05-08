import React from "react";
import * as _ from "lodash";
import * as fp from "lodash/fp";
import { Position, Pane, Button, Popover } from "evergreen-ui";

import makeFetcher from "../Api";
import visualization from "./Visualization";
import * as d3 from "../../lib/d3";

const orgHierarchy = `
query($org: String!) {
  rateLimit {
    remaining
  }

  organization(login: $org) {
    teams(first: 100) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        members(first: 100) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            login
            name
            avatarUrl
          }
        }
        childTeams(first: 100) {
          nodes {
            name
          }
        }
        ancestors(first: 100) {
          nodes {
            name
          }
        }
      }
    }
  }
}
`;

function processResponse(resultSet, data) {
  const teams = _.get(data, "data.organization.teams.nodes", []);
  if (teams.length === 0) {
    throw new Error("No teams found or insufficient permission");
  }

  let levels = fp.flow(
    fp.reduce((acc, team) => {
      const ancestors = team.ancestors.nodes;
      const level = ancestors.length;

      if (!acc[level]) {
        acc[level] = [];
      }
      const entry = {
        id: team.name,
        members: team.members.nodes.map(member => ({
          ...member,
          id: member.name || member.login,
          parents: [team.name]
        }))
      };
      if (level > 0) {
        entry.parents = [ancestors[ancestors.length - 1].name];
      }
      acc[level].push(entry);

      return acc;
    }, resultSet)
  )(teams);

  // leaf nodes are the members
  // for (let i = 0; i < levels.length; i += 1) {
  //   const level = levels[i];
  //   const members = level.reduce((acc, team) => {
  //     team.members.forEach(member => {
  //       if (!acc.has(member.login)) {
  //         acc.set(member.login, {
  //           id: member.login,
  //           parents: [team.id]
  //         });
  //       }
  //     });

  //     return acc;
  //   }, new Map());

  //   levels.splice(++i, 0, Array.from(members.values()));
  // }

  return levels;
}

class HierarchyDiagram extends React.Component {
  state = {
    resultSet: [],
    filtered: {}
  };

  constructor(props) {
    super(props);
    this.fetcher = makeFetcher(orgHierarchy, this.onFetch, props.token);
  }

  componentDidMount() {
    this.fetch();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.org !== prevProps.org) {
      this.fetch();
    }
  }

  componentDidCatch(error) {
    this.props.onError(error);
  }

  onFetch = (acc, data) => {
    return new Promise((resolve, reject) => {
      try {
        const stepResults = processResponse(acc, data);
        resolve({
          results: stepResults
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  fetch() {
    const { org, setLoading, resetError, onError } = this.props;
    resetError();
    setLoading(true);

    this.fetcher({ org }, [])
      .then(resultSet => {
        this.setState({
          resultSet,
          filtered: HierarchyDiagram.build(resultSet)
        });
        setLoading(false);
      })
      .catch(onError);
  }

  static build(data) {
    let levels = _.cloneDeep(data);
    // precompute level depth
    levels.forEach((l, i) => l.forEach(n => (n.level = i)));

    const nodes = levels.reduce((a, x) => a.concat(x), []);
    const nodes_index = {};
    nodes.forEach(d => (nodes_index[d.id] = d));

    // objectification
    nodes.forEach(d => {
      d.parents = (d.parents === undefined ? [] : d.parents).map(
        p => nodes_index[p]
      );
    });

    // precompute bundles
    levels.forEach((l, i) => {
      var index = {};
      l.forEach(n => {
        if (n.parents.length == 0) {
          return;
        }

        var id = n.parents
          .map(d => d.id)
          .sort()
          .join("--");
        if (id in index) {
          index[id].parents = index[id].parents.concat(n.parents);
        } else {
          index[id] = {
            id: id,
            parents: n.parents.slice(),
            level: i
          };
        }
        n.bundle = index[id];
      });
      l.bundles = Object.keys(index).map(k => index[k]);
      l.bundles.forEach((b, i) => (b.i = i));
    });

    const links = [];
    nodes.forEach(d => {
      d.parents.forEach(p =>
        links.push({
          source: d,
          bundle: d.bundle,
          target: p
        })
      );
    });

    const bundles = levels.reduce((a, x) => a.concat(x.bundles), []);

    // reverse pointer from parent to bundles
    bundles.forEach(b =>
      b.parents.forEach(p => {
        if (p.bundles_index === undefined) {
          p.bundles_index = {};
        }
        if (!(b.id in p.bundles_index)) {
          p.bundles_index[b.id] = [];
        }
        p.bundles_index[b.id].push(b);
      })
    );

    nodes.forEach(n => {
      if (n.bundles_index !== undefined) {
        n.bundles = Object.keys(n.bundles_index).map(k => n.bundles_index[k]);
      } else {
        n.bundles_index = {};
        n.bundles = [];
      }
      n.bundles.forEach((b, i) => (b.i = i));
    });

    links.forEach(l => {
      if (l.bundle.links === undefined) {
        l.bundle.links = [];
      }
      l.bundle.links.push(l);
    });

    // layout
    const padding = 8;
    const node_height = 22;
    const node_width = 120; // 70
    const bundle_width = 14; // 14
    const level_y_padding = 16;
    const metro_d = 4;
    const c = 16;
    const min_family_height = 16;

    nodes.forEach(
      n => (n.height = (Math.max(1, n.bundles.length) - 1) * metro_d)
    );

    let x_offset = padding;
    let y_offset = padding;
    levels.forEach(l => {
      x_offset += l.bundles.length * bundle_width;
      y_offset += level_y_padding;
      l.forEach((n, i) => {
        n.x = n.level * node_width + x_offset;
        n.y = node_height + y_offset + n.height / 2;

        y_offset += node_height + n.height;
      });
    });

    let i = 0;
    levels.forEach(l => {
      l.bundles.forEach(b => {
        b.x =
          b.parents[0].x +
          node_width +
          (l.bundles.length - 1 - b.i) * bundle_width;
        b.y = i * node_height;
      });
      i += l.length;
    });

    links.forEach(l => {
      l.xt = l.target.x;
      l.yt =
        l.target.y +
        l.target.bundles_index[l.bundle.id].i * metro_d -
        (l.target.bundles.length * metro_d) / 2 +
        metro_d / 2;
      l.xb = l.bundle.x;
      l.xs = l.source.x;
      l.ys = l.source.y;
    });

    // compress vertical space
    let y_negative_offset = 0;
    levels.forEach(l => {
      y_negative_offset +=
        -min_family_height +
          d3.min(l.bundles, b =>
            d3.min(b.links, link => link.ys - c - (link.yt + c))
          ) || 0;
      l.forEach(n => (n.y -= y_negative_offset));
    });

    // very ugly, I know
    links.forEach(l => {
      l.yt =
        l.target.y +
        l.target.bundles_index[l.bundle.id].i * metro_d -
        (l.target.bundles.length * metro_d) / 2 +
        metro_d / 2;
      l.ys = l.source.y;
      l.c1 = l.source.level - l.target.level > 1 ? node_width + c : c;
      l.c2 = c;
    });

    const layout = {
      height: d3.max(nodes, n => n.y) + node_height / 2 + 2 * padding,
      width: d3.max(nodes, n => n.x) + node_width / 2 + 2 * padding,
      node_height,
      node_width,
      bundle_width,
      level_y_padding,
      metro_d
    };

    return {
      nodes,
      nodes_index,
      links,
      bundles,
      layout
    };
  }

  setFilteredNodes = nodes => {
    this.setState({
      filtered: HierarchyDiagram.build(nodes)
    });
  };

  filterByNode = (event, node) => {
    event.stopPropagation();
    const currentRootNodes = this.state.filtered.nodes;
    if (
      // currentRootNodes.length === 1 &&
      // node.id !== currentRootNodes[0].id &&
      node.members
    ) {
      this.setFilteredNodes([[{ id: node.id }], node.members]);
    }
  };

  resetFilter = () => {
    this.setFilteredNodes(this.state.resultSet);
  };

  render() {
    const { filtered, focusedNode } = this.state;
    const { bundles, nodes, layout } = filtered;
    const { error } = this.props;

    if (error) {
      return null;
    }

    if (!(bundles && nodes)) {
      return null;
    }

    const color = d3.scaleOrdinal(d3.schemeDark2);

    return (
      <svg
        width="1100"
        height={layout.height}
        className="hierarchy-diagram"
        onClick={this.resetFilter}
      >
        {bundles.map(b => {
          const d = b.links
            .map(
              l => `
            M${l.xt} ${l.yt}
            L${l.xb - l.c1} ${l.yt}
            A${l.c1} ${l.c1} 90 0 1 ${l.xb} ${l.yt + l.c1}
            L${l.xb} ${l.ys - l.c2}
            A${l.c2} ${l.c2} 90 0 0 ${l.xb + l.c2} ${l.ys}
            L${l.xs} ${l.ys}`
            )
            .join("");

          return (
            <>
              <path
                className="link"
                d={d}
                stroke="white"
                strokeWidth="5"
                fill="none"
              />
              <path
                className="link"
                d={d}
                stroke={color(b.id)}
                strokeWidth="2"
                fill="none"
              />
            </>
          );
        })}

        {nodes.map(n => (
          <>
            <circle
              className="node"
              stroke="black"
              strokeWidth="2"
              fill="white"
              r="4"
              cx={n.x}
              cy={n.y}
            />
            {n.login ? (
              <Popover
                position={Position.RIGHT}
                content={
                  <Pane paddingX={8} paddingY={8}>
                    <img
                      src={n.avatarUrl}
                      width={32}
                      height={32}
                      style={{ verticalAlign: "middle" }}
                    />
                    <span style={{ marginLeft: 8 }}>@{n.login}</span>
                  </Pane>
                }
              >
                {({ toggle, getRef }) => (
                  <text
                    ref={el => getRef(el)}
                    onMouseEnter={toggle}
                    onMouseLeave={toggle}
                    x={n.x + 4}
                    y={n.y - n.height / 2 - 4}
                  >
                    {n.id}
                  </text>
                )}
              </Popover>
            ) : (
              <text
                x={n.x + 4}
                y={n.y - n.height / 2 - 4}
                // stroke={n.members.length > 0 ? color(n.id) : "none"}
                onClick={e => this.filterByNode(e, n)}
              >
                {n.id}
              </text>
            )}
          </>
        ))}
      </svg>
    );
  }
}

export default visualization(HierarchyDiagram);
