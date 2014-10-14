var globalsFilter = new ReactiveVar([]);

Template.crossref.rendered = function() {
  $('#globals_filter').chosen();

  //TODO reselect when already selected options

  $("#globals_filter").on("change", function(evt) {
    globalsFilter.set(_.map(evt.target.selectedOptions, function(option) {
      return option.value;
    }));
  });
};

Template.crossref.destroyed = function() {
  $('#globals_filter').chosen('destroy');
};

//TODO github link
//TODO https://github.com/meteor/meteor/blob/devel/packages/ddp/crossbar.js#L50

Template.crossref.helpers({
  packagesSelected: function() {
    return getSelectedPackages();
  },
  globalsFiltered: function() {
    var globalsAllowed = globalsFilter.get();
    var globals = _.filter(this.globals, function(global) {
      return _.contains(globalsAllowed, global.name);
    });

    return globals;
  },
  globalsUnique: function() {
    var globals = [];

    _.each(getSelectedPackages().fetch(), function(pkg) {
      _.each(pkg.files, function(file) {
        _.each(file.globals, function(global) {
          globals.push(global.name);
        });
      });
    });

    Tracker.afterFlush(function() {
      $("#globals_filter").trigger("chosen:updated");
    });

    return _.uniq(globals);
  }
});
