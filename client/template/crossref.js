var globalsFilter = new ReactiveVar([]);
var usedExportsFilter = new ReactiveVar([]);

Template.crossref.rendered = function() {
  $('#globals_filter').chosen({
    width: '100%'
  });
  $('#used_exports_filter').chosen({
    width: '100%'
  });

  //TODO reselect when already selected options

  $("#globals_filter").on("change", function(evt) {
    globalsFilter.set(_.map(evt.target.selectedOptions, function(option) {
      return option.value.split("@")[0];
    }));
  });

  $("#used_exports_filter").on("change", function(evt) {
    usedExportsFilter.set(_.map(evt.target.selectedOptions, function(option) {
      return option.value.split("@")[0];
    }));
  });
};

Template.crossref.destroyed = function() {
  $('#globals_filter').chosen('destroy');
  $('#used_exports_filter').chosen('destroy');
};

var getGlobalsByPackage = function(pkg) {
  var globals = [];

  _.each(pkg.files, function(file) {
    _.each(file.globals, function(global) {
      globals.push(global.name);
    });
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
    } else if (selectedPackages.length > 1) {
      formattedOptions = _.map(getGlobalsByPackage(pkg), function(global) {
        return global + "@" + pkg.name;
      });
    } else {
      formattedOptions = getGlobalsByPackage(pkg);
    }

    allOptions = allOptions.concat(formattedOptions);
  });

  return _.uniq(allOptions);
};

Template.crossref.helpers({
  globalsFiltered: function() {
    var globalsAllowed = globalsFilter.get();

    globalsAllowed = globalsAllowed.concat(usedExportsFilter.get());

    var globals = _.filter(this.globals, function(global) {
      return _.contains(globalsAllowed, global.name);
    });

    return globals;
  },
  usedExportsOfDependentPackages: function() {
    Tracker.afterFlush(function() {
      $("#used_exports_filter").trigger("chosen:updated");
    });

    return getOptions(true);
  },
  packageGlobals: function() {
    //TODO filter globals not defined in package

    Tracker.afterFlush(function() {
      $("#globals_filter").trigger("chosen:updated");
    });

    return getOptions();
  },
  github: function() {
    var baseUrl = "https://github.com/meteor/meteor/blob/devel/packages";

    var global = this;
    var file = Template.parentData(1);
    var pkg = Template.parentData(2);

    return baseUrl + "/" + pkg.name + "/" + file.name + "#L" + global.line;
  }
});
