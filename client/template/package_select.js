Template.package_select.rendered = function() {
  $("#packages_select").chosen();

  $("#packages_select").on("change", function(evt) {
    packagesFilter.set(_.map(evt.target.selectedOptions, function(option) {
      return option.value;
    }));
  });

  //TODO investigate...
  //TODO flush after packages cursor reruns and adds options to select
  //TODO always before added callback runs or just the call order?
  Packages.find().observe({
    added: _.throttle(function() {
      $("#packages_select").trigger("chosen:updated");
    }, 500)
  });
};
