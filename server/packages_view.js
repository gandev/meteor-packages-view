Meteor.methods({
  gandevPackagesAnalyzer_analyze(projectId, path) {
    check(projectId, String);

    console.time("analyzePackages");

    Project = Projects.findOne(projectId);

    const analyzer = new Analyzer(path);

    Projects.update(projectId, {
      $set: {
        projectPath: path,
        analyzerResults: []
      }
    });

    Packages.remove({});

    _.each(analyzer.getPackages(), function(pkg) {
      try {
        Packages.insert(pkg);
      } catch(err) {
        console.log('ERROR', pkg.name, err);
      }
    });

    Projects.update(projectId, {
      $set: {
        analyzerResults: analyzer._results
      }
    });

    console.timeEnd("analyzePackages");
  }
});
