Packages = new Mongo.Collection("packages");

if (Meteor.isClient) {
  packagesSubHandle = Meteor.subscribe("all-packages");
}

if (Meteor.isServer) {
  Meteor.publish("all-packages", function() {
    return Packages.find();
  });
}
