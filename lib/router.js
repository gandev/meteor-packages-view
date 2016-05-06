Router.configure({
  layoutTemplate: 'AppLayout'
});

Router.route('/', function() {
  this.render('packages_list');
});

Router.route('/analyzer', function() {
  this.render('analyzer');
});

Router.route('/packages_list', function() {
  this.render('packages_list');
});

Router.route('/crossref', function() {
  this.render('crossref');
});

Router.route('/dependency_graph', function() {
  this.render('dependency_graph');
});
