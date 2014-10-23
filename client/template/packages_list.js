Template.packages_list.events({
  'change #show_all_packages': function(evt, tmpl) {
    Session.set("SHOW_ALL_PACKAGES", $(evt.target).is(":checked"));
  }
});

Template.packages_list.helpers({
  showAllPackagesChecked: function() {
    return Session.equals("SHOW_ALL_PACKAGES", true) ? 'checked' : '';
  }
});
