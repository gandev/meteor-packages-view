Projects = new Mongo.Collection('projects');

if (Meteor.isClient) {
  Packages = new Mongo.Collection('packages');

  packagesSubHandle = Meteor.subscribe('all-packages');
}

if (Meteor.isServer) {
  Packages = new Mongo.Collection('packages' /*, {connection: null} */ );

  Meteor.publish('all-packages', function() {
    return [
      Projects.find(),
      Packages.find()
    ];
  });
}
