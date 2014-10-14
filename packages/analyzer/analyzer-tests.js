var analyzer = new Analyzer('/home/ag/dev/meteor/packages');

Tinytest.add('extract exports from all meteor packages', function(test) {
  test.isTrue(_.keys(analyzer.getPackages()).length > 0);
});

Tinytest.add('find occurences of export', function(test) {
  console.log(analyzer.getOccurences('ddp', 'LocalCollection'));
});
