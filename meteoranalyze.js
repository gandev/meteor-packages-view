PackageExports = new Mongo.Collection("package-exports");
PackageUses = new Mongo.Collection("package-uses");

if (Meteor.isClient) {
  Session.setDefault("SHOW_USES", true);

  Template.packages.helpers({
    packages: function() {
      return PackageExports.find();
    },
    uses: function() {
      return PackageUses.find();
    },
    showUses: function() {
      return Session.get("SHOW_USES");
    }
  });

  Template.packages.events({
    'change input[type=checkbox]': function(evt, tmpl) {
      Session.set("SHOW_USES", $(evt.target).is(":checked"));
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    PackageExports.remove({});

    var analyzer = new Analyzer();

    var exports = analyzer.getPackageExports();

    _.each(exports, function(exp) {
      PackageExports.insert(exp);
    });

    var uses = analyzer.getPackageUses();

    _.each(uses, function(use) {
      PackageUses.insert(use);
    });
  });
}
