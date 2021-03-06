Template.package_select.rendered = function() {
  $("#packages_select").chosen({
    width: '100%'
  });

  $("#packages_select").on("change", function(evt) {
    const selectedPackages = _.map(evt.target.selectedOptions, function(option) {
      return option.value;
    });

    packagesFilter.set(selectedPackages);

    window.localStorage.setItem('packagesView:selectedPackages', selectedPackages);
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
