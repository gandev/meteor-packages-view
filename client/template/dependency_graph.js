var width;

var HEIGHT = 300;
var height;

var renderDependencyGraph = function(svg, root, idx) {
  var cluster = d3.layout.cluster()
    .size([HEIGHT, width - 400]);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) {
      return [d.y, d.x];
    });

  svg = svg.append("g")
    .attr("transform", "translate(150," + HEIGHT * idx + ")");

  var nodes = cluster.nodes(root),
    links = cluster.links(nodes);

  var link = svg.selectAll(".link")
    .data(links)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", diagonal);

  var node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) {
      return "translate(" + d.y + "," + d.x + ")";
    });

  node.append("circle")
    .attr("r", 4.5);

  node.append("text")
    .attr("dx", function(d) {
      return d.children ? -8 : 8;
    })
    .attr("dy", 3)
    .style("text-anchor", function(d) {
      return d.children ? "end" : "start";
    })
    .text(function(d) {
      return d.name;
    });
};

var renderAutorun;

Template.dependency_graph.rendered = function() {
  var adjustWidth = _.debounce(function() {
    Session.set("DOCUMENT_WIDTH", $(window).width());
  }, 200);

  adjustWidth();

  $(window).resize(function(arg) {
    adjustWidth();
  });

  renderAutorun = Tracker.autorun(function() {
    var packages = getSelectedPackages().fetch();

    console.log("rerender graph");

    width = Session.get("DOCUMENT_WIDTH");
    height = HEIGHT * packages.length;

    var svg = d3.select("#dependency-graph")
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    _.each(packages, function(pkg, idx) {
      var root = {
        name: pkg.name,
        children: []
      };

      _.each(pkg.usedInPackages, function(name) {
        root.children.push({
          name: name,
          children: []
        });
      });

      _.each(pkg.uses, function(use) {
        if (use.name) {
          //TODO uses on the left
        }
      });

      renderDependencyGraph(svg, root, idx);
    });
  });
};

Template.dependency_graph.destroyed = function() {
  if (renderAutorun) renderAutorun.stop();
};
