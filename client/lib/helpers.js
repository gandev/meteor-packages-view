packagesFilter = new ReactiveVar([]);

getSelectedPackages = function() {
  return Packages.find({
    name: {
      '$in': packagesFilter.get()
    }
  });
};

Template.registerHelper('packages', function() {
  return Packages.find();
});
