if (Meteor.isServer) {
  Meteor.methods({
    'analyzePackages': function() {
      Packages.remove({});

      //var analyzer = new Analyzer('/Users/ares/dev/js/meteor/packages');
      var analyzer = new Analyzer('/home/ag/dev/meteor/packages');

      var packages = analyzer.getPackages();

      _.each(packages, function(pkg) {
        Packages.insert(pkg);
      });
    }
  });
}
