Template.dependency_graph.rendered = function() {
  $("#packages_select").chosen();

  $("#packages_select").on("change", function(evt) {
    packagesFilter.set(_.map(evt.target.selectedOptions, function(option) {
      return option.value;
    }));
  });

  //TODO investigate...
  //TODO flush after packages cursor reruns and adds options to select
  //TODO always before added callback runs or just the call order?
  Packages.find().observe({
    added: _.throttle(function() {
      $("#packages_select").trigger("chosen:updated");
    }, 500)
  });
};

var packagesFilter = new ReactiveVar([]);

ForceVariants = {};

Session.setDefault("FORCE", "renderForce1");

ForceVariants.renderForce1 = function(svg, force) {
  force.linkDistance(200)
    .charge(-300)
    .start();

  // build the arrow.
  svg.append("svg:defs").selectAll("marker")
    .data(["end"]) // Different link/path types can be defined here
    .enter().append("svg:marker") // This section adds in the arrows
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  // add the links and the arrows
  var path = svg.append("svg:g").selectAll("path")
    .data(force.links())
    .enter().append("svg:path")
    .attr("class", "link")
    .attr("marker-end", "url(#end)");

  // define the nodes
  var node = svg.selectAll(".node")
    .data(force.nodes())
    .enter().append("g")
    .attr("class", "node")
    .call(force.drag);

  // add the nodes
  node.append("circle")
    .attr("r", function(pkgNode) {
      var radius = 5;
      if (_.contains(packagesFilter.get(), pkgNode.name)) {
        radius = 10;
      }
      return radius;
    });

  // add the text
  node.append("text")
    .attr("x", 12)
    .attr("dy", ".35em")
    .text(function(d) {
      return d.name;
    });

  force.on("tick", function() {
    path.attr("d", function(d) {
      // add the curvy lines
      var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
      return "M" +
        d.source.x + "," +
        d.source.y + "A" +
        dr + "," + dr + " 0 0,1 " +
        d.target.x + "," +
        d.target.y;
    });

    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  });
};

ForceVariants.renderForce2 = function(svg, force) {
  var color = d3.scale.category20();

  force.charge(-120)
    .linkDistance(30)
    .start();

  var link = svg.selectAll(".link")
    .data(force.links())
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function(d) {
      return Math.sqrt(d.value);
    });

  // var node = svg.selectAll(".node")
  //   .data(force.nodes())
  //   .enter().append("circle")
  //   .attr("class", "node")
  //   .attr("r", 5)
  //   .style("fill", function(d) {
  //     return color(d.group);
  //   })
  //   .call(force.drag);
  //
  // node.append("title")
  //   .text(function(d) {
  //     return d.name;
  //   });

  // define the nodes
  var node = svg.selectAll(".node")
    .data(force.nodes())
    .enter().append("g")
    .attr("class", "node")
    .call(force.drag);

  // add the nodes
  node.append("circle")
    .attr("r", function(pkgNode) {
      var radius = 5;
      if (_.contains(packagesFilter.get(), pkgNode.name)) {
        radius = 10;
      }
      return radius;
    });

  // add the text
  node.append("text")
    .attr("x", 12)
    .attr("dy", ".35em")
    .text(function(d) {
      return d.name;
    });

  force.on("tick", function() {
    link.attr("x1", function(d) {
        return d.source.x;
      })
      .attr("y1", function(d) {
        return d.source.y;
      })
      .attr("x2", function(d) {
        return d.target.x;
      })
      .attr("y2", function(d) {
        return d.target.y;
      });



    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  });
};

Meteor.autorun(function() {
  console.log("rerender graph");

  var allPackages = Packages.find().fetch();

  var packages = {};
  _.each(allPackages, function(pkg) {
    packages[pkg.name] = pkg;
  });

  var packagesToWatch = Packages.find({
    name: {
      '$in': packagesFilter.get()
    }
  }).fetch();

  var links = [];

  var nodes = {};
  _.each(packagesToWatch, function(pkg) {
    nodes[pkg.name] = packages[pkg.name];
  });

  _.each(packagesToWatch, function(pkg) {
    _.each(pkg.uses, function(use) {
      if (packages[use.name]) {
        if (!nodes[use.name]) {
          nodes[use.name] = packages[use.name];
        }

        links.push({
          source: packages[use.name],
          target: packages[pkg.name],
          value: 1.0
        });
      }
    });
  });

  var width = 900,
    height = 600;

  var svg = d3.select("#dependency-graph")
    .attr("width", width)
    .attr("height", height);

  svg.selectAll("*").remove();

  var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height]);

  ForceVariants[Session.get("FORCE")](svg, force);
});
