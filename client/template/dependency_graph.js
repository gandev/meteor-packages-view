var width;
var height;

var createLinksBetweenNodes = function(svg, nodes, map) {
  var links = [];
  // For each use, construct a link from the source to target node.
  _.each(nodes, function(node) {
    _.each(node.uses || [], function(use) {
      if (!map[use.name]) return;

      links.push({
        source: map[node.name],
        target: map[use.name]
      });
    });
  });

  var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(0.6)
    .radius(function(d) {
      return d.y;
    })
    .angle(function(d) {
      return d.x / 180 * Math.PI;
    });

  var bundle = d3.layout.bundle();

  var paths = svg.append("g").selectAll(".link")
    .data(bundle(links))
    .enter()
    .append("path")
    .each(function(d) {
      d.source = d[0];
      d.target = d[d.length - 1];
    })
    .attr("class", "link")
    .attr("d", line);

  return paths;
};

var renderDependencyGraph = function(svg, packages) {
  var root = {
    name: "",
    children: _.filter(packages, function(pkg) {
      return pkg.uses.length > 0 || pkg.usedInPackages && pkg.usedInPackages.length > 0;
    })
  };

  var diameter = width;
  var radius = diameter / 2;
  var innerRadius = radius - 180;

  svg = svg.append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");

  var cluster = d3.layout.cluster()
    .size([360, innerRadius]);

  var node = svg.append("g").selectAll(".node");

  var nodes = cluster.nodes(root);
  nodes.splice(0, 1); //remove root node

  var map = {};
  _.each(nodes, function(node) {
    map[node.name] = node;
  });

  var links = createLinksBetweenNodes(svg, nodes, map);

  var selectNodes = function(d) {
    node.each(function(n) {
      n.target = false;
      n.source = false;
    });

    links.classed("link--target", function(l) {
        if (_.contains(d, l.target) || l.target === d) {
          l.source.source = true;
          return true;
        }
      })
      .classed("link--source", function(l) {
        if (_.contains(d, l.source) || l.source === d) {
          l.target.target = true;
          return true;
        }
      });

    node.classed("node--target", function(n) {
        return n.target;
      })
      .classed("node--source", function(n) {
        return n.source;
      });
  };

  var clearSelection = function(d) {
    links.classed("link--target", false)
      .classed("link--source", false);

    node.classed("node--target", false)
      .classed("node--source", false)
      .classed("node-selected", false);
  };

  node = node.data(nodes)
    .enter()
    .append("text")
    .attr("class", "node")
    .attr("dy", ".31em")
    .attr("transform", function(d) {
      return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)");
    })
    .style("text-anchor", function(d) {
      return d.x < 180 ? "start" : "end";
    })
    .text(function(d) {
      return d.name;
    })
    .on("mouseover", function(d) {
      if (packagesFilter.get().length > 0) return;

      selectNodes(d);
    })
    .on("mouseout", function(d) {
      if (packagesFilter.get().length > 0) return;

      clearSelection();
    });

  Tracker.autorun(function() {
    var selectedPackages = getSelectedPackages().fetch();

    clearSelection();

    var selectedNodes = [];
    _.each(selectedPackages, function(pkg) {
      selectedNodes.push(map[pkg.name]);
    });

    node.classed("node-selected", function(d) {
      return _.contains(selectedNodes, d);
    });

    selectNodes(selectedNodes);
  });
};

var renderAutorun;

Template.dependency_graph.rendered = function() {
  var adjustWidth = _.debounce(function() {
    Session.set("GRAPH_WIDTH", $(".container-fluid").width());
  }, 200);

  adjustWidth();

  $(window).resize(function(arg) {
    adjustWidth();
  });

  renderAutorun = Tracker.autorun(function() {
    var packages = Packages.find().fetch();

    console.log("rerender graph");

    width = Session.get("GRAPH_WIDTH");
    height = width;

    var svg = d3.select("#dependency-graph")
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    renderDependencyGraph(svg, packages);
  });
};

Template.dependency_graph.destroyed = function() {
  if (renderAutorun) renderAutorun.stop();
};