const selectedPackagesSaved = window.localStorage.getItem('packagesView:selectedPackages') || '';

packagesFilter = new ReactiveVar(selectedPackagesSaved.split(','));

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

Template.registerHelper('packagesSelected', function() {
  return getSelectedPackages();
});

Template.registerHelper('prettyJSON', function(obj) {
  return JSON.stringify(this || obj, null, 2);
});

Template.registerHelper('log', function() {
  console.log(this, arguments);
});
