packagesFilter = new ReactiveVar([]);

getSelectedPackages = function() {
  return Packages.find({
    name: {
      '$in': packagesFilter.get()
    }
  });
};

getDependentPackages = function() {
  var selectedPackages = getSelectedPackages().fetch();

  var dependentPackages = [];
  _.each(selectedPackages, function(pkg) {
    var usedPackages = _.map(pkg.uses, function(use) {
      return use.name;
    });
    dependentPackages = dependentPackages.concat(usedPackages);
  });

  return Packages.find({
    name: {
      '$in': dependentPackages
    }
  });
};

Template.registerHelper('packages', function() {
  return Packages.find();
});

Template.registerHelper('packagesSelected', function() {
  return getSelectedPackages();
});

Template.registerHelper('packagesDependent', function() {
  return getDependentPackages();
});
