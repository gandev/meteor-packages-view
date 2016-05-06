Meteor.methods({
  gandevPackagesAnalyzer_analyze(projectId, path) {
    check(projectId, String);

    console.time("analyzePackages");

    Project = Projects.findOne(projectId);

    const analyzer = new Analyzer(path);

    Projects.update(projectId, {
      projectPath: path
    });

    Packages.remove({});

    _.each(analyzer.getPackages(), function(pkg) {
      try {
        Packages.insert(_.extend(pkg, ));
      } catch(e) {
        console.log('ERROR:', pkg.name);
      }
    });

    console.timeEnd("analyzePackages");
  }
});
