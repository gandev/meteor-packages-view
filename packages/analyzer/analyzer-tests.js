Tinytest.add('extract exports from all meteor packages', function(test) {
  var analyzer = new Analyzer();

  test.isTrue(_.keys(analyzer.getPackageExports()).length > 0);
});