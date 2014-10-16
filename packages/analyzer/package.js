Package.describe({
  summary: "meteor package analyzer",
  version: "0.1.0",
  git: ""
});

Npm.depends({
  'escope': '1.0.1'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.4');

  api.use('underscore');
  api.use('http');

  api.addFiles('analyzer.js', 'server');
  api.addFiles('github_data.js', 'server');

  api.export('Analyzer');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('analyzer');

  api.use('underscore');

  api.addFiles('analyzer-tests.js', 'server');
});
