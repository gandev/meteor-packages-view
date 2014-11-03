var packageGlobalsFilter = new ReactiveVar([]);
var usedExportsFilter = new ReactiveVar([]);

var packagesReferenced = new ReactiveVar([]);

var getPackageName = function(option) {
  return option.split("@")[0];
};

Tracker.autorun(function() {
  var selectedPackages = getSelectedPackages().fetch();
  var globals = packageGlobalsFilter.get();

  var packages = [];
  _.each(selectedPackages, function(pkg) {
    _.each(pkg.usedInPackages, function(pkgUses) {
      //TODO use minimongo query!? and get rid of analyzer logic
      _.each(pkgUses.exports, function(exp) {
        if (_.contains(globals, exp)) {
          packages.push(pkgUses.name);
        }
      });
    });
  });

  packagesReferenced.set(packages);
});

Template.crossref.rendered = function() {
  $('#globals_filter').chosen({
    width: '100%'
  });

  $('#used_exports_filter').chosen({
    width: '100%'
  });

  var packageGlobalsSelected = packageGlobalsFilter.get();

  $('#globals_filter option').each(function() {
    var option = $(this);
    if (_.find(packageGlobalsSelected, function(global) {
        return new RegExp("^" + global).test(option.text());
      })) {
      option.prop('selected', true);
    }
  });

  $("#globals_filter").trigger("chosen:updated");

  $("#globals_filter").on("change", function(evt) {
    packageGlobalsFilter.set(_.map(evt.target.selectedOptions, function(option) {
      return getPackageName(option.value);
    }));
  });

  var usedExportsSelected = usedExportsFilter.get();

  $('#used_exports_filter option').each(function() {
    var option = $(this);
    if (_.find(usedExportsSelected, function(global) {
        return new RegExp("^" + global).test(option.text());
      })) {
      option.prop('selected', true);
    }
  });

  $("#used_exports_filter").trigger("chosen:updated");

  $("#used_exports_filter").on("change", function(evt) {
    usedExportsFilter.set(_.map(evt.target.selectedOptions, function(option) {
      return getPackageName(option.value);
    }));
  });
};

Template.crossref.destroyed = function() {
  $('#globals_filter').chosen('destroy');
  $('#used_exports_filter').chosen('destroy');
};

var getPackageGlobals = function(pkg) {
  var globals = [];

  _.each(pkg.files, function(file) {
    if (file.packageGlobals) {
      globals = globals.concat(file.packageGlobals);
    }
  });

  return globals;
};

var getOptions = function(exports) {
  var allOptions = [];
  var selectedPackages = getSelectedPackages().fetch();
  _.each(selectedPackages, function(pkg) {
    var formattedOptions = [];
    if (exports) {
      _.each(pkg.usedExports, function(exp, pkgName) {
        _.each(exp, function(exportName) {
          formattedOptions.push(exportName + "@" + pkgName);
        });
      });

      _.each(pkg.files, function(file) {
        _.each(file.globalsUsed, function(global) {
          //TODO
          if (global.name === "Npm" || global.name === "cordova") {
            formattedOptions.push(global.name);
          }
        });
      });
    } else if (selectedPackages.length > 1) {
      formattedOptions = _.map(getPackageGlobals(pkg), function(global) {
        return global + "@" + pkg.name;
      });
    } else {
      formattedOptions = getPackageGlobals(pkg);
    }

    allOptions = allOptions.concat(formattedOptions);
  });

  return _.uniq(allOptions);
};

Template.crossref.helpers({
  packagesReferenced: function() {
    return Packages.find({
      name: {
        '$in': packagesReferenced.get()
      }
    });
  },
  usedExportsOfDependentPackages: function() {
    Tracker.afterFlush(function() {
      $("#used_exports_filter").trigger("chosen:updated");
    });

    return getOptions(true);
  },
  packageGlobals: function() {
    Tracker.afterFlush(function() {
      $("#globals_filter").trigger("chosen:updated");
    });

    return getOptions();
  },
  isExportClass: function() {
    return Packages.findOne({
      exports: {
        '$elemMatch': {
          name: getPackageName(this.toString())
        }
      }
    }) ? 'package-export' : '';
  }
});

Template.crossref_uses.helpers({
  globalsFiltered: function() {
    var globalsAllowed = packageGlobalsFilter.get().concat(usedExportsFilter.get());

    var globals = _.filter(this.globalsUsed, function(global) {
      return _.contains(globalsAllowed, global.name);
    });

    return globals;
  },
  github: function() {
    var baseUrl = "https://github.com/meteor/meteor/blob/devel/packages";

    var global = this;
    var file = Template.parentData(1);
    var pkg = Template.parentData(2);

    return baseUrl + "/" + pkg.name + "/" + file.name + "#L" + global.line;
  }
});