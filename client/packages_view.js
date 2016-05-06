Template.header.helpers({
  activeTab(path) {
    var currentRoute = Router.current();
    return currentRoute && currentRoute.location.get().path === path ? 'active' : '';
  },
  isAnalyzed() {
    return !! Packages.findOne();
  }
});

Template.analyzer.helpers({
  projects: function() {
    return Projects.find();
  }
});

Template.analyzer.events({
  'click .action-analyze': function(evt, tmpl) {
    Meteor.call('gandevPackagesAnalyzer_analyze', this._id, tmpl.find('input[name="projectPath"]').value);
  },
  'click .action-create-project'() {
    Projects.insert({});
  }
});
