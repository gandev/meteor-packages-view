if (Meteor.isServer) {
  Meteor.methods({
    'analyzePackages': function() {
      console.time("analyzePackages");

      //var analyzer = new Analyzer('/Users/ares/dev/js/meteor/packages');
      //var analyzer = new Analyzer('/home/ag/dev/meteor/packages');
      var analyzer = new Analyzer("/repos/meteor/meteor/contents/packages", true);

      var packages = analyzer.getPackages();

      Packages.remove({});

      _.each(packages, function(pkg) {
        Packages.insert(pkg);
      });

      console.timeEnd("analyzePackages");
    }
  });
}
