var isMemberExpression = function(statement) {
  return statement.type === "ExpressionStatement" &&
    statement.expression.type === "CallExpression" &&
    statement.expression.callee.type === "MemberExpression";
};

var isOnUse = function(statement) {
  if (!isMemberExpression(statement)) return;

  var callee = statement.expression.callee;

  return callee.object.name === "Package" &&
    (callee.property.name === "on_use" ||
      callee.property.name === "onUse");
};

var isExport = function(statement, apiVar) {
  if (!isMemberExpression(statement)) return;

  var callee = statement.expression.callee;

  return callee.object.name === apiVar &&
    callee.property.name === "export";
};

var isUse = function(statement, apiVar) {
  if (!isMemberExpression(statement)) return;

  var callee = statement.expression.callee;

  return callee.object.name === apiVar &&
    callee.property.name === "use";
};

var parseExport = function(statement) {
  var exportArg = statement.expression.arguments[0];

  var exportArchArg = statement.expression.arguments[1] || {};
  if (exportArchArg.type === "Literal") {
    exportArchArg = [exportArchArg.value];
  } else if (exportArchArg.type === "ArrayExpression") {
    exportArchArg = _.map(exportArchArg.elements,
      function(elem) {
        return elem.value;
      });
  } else {
    //no arch specified
    exportArchArg = ["everywhere"];
  }

  var exportArch = {
    arch: exportArchArg
  };

  var exports = [];

  if (exportArg.type === "Literal") {
    exports.push(_.extend({
      name: exportArg.value
    }, exportArch));
  } else if (exportArg.type === "ArrayExpression") {
    _.each(exportArg.elements, function(elem) {
      exports.push(_.extend({
        name: elem.value
      }, exportArch));
    });
  }

  return exports;
};

var parseUse = function(statement) {
  var exportArg = statement.expression.arguments[0];

  var exportArchArg = statement.expression.arguments[1] || {};
  if (exportArchArg.type === "Literal") {
    exportArchArg = [exportArchArg.value];
  } else if (exportArchArg.type === "ArrayExpression") {
    exportArchArg = _.map(exportArchArg.elements,
      function(elem) {
        return elem.value;
      });
  } else {
    //no arch specified
    exportArchArg = ["everywhere"];
  }

  var exportArch = {
    arch: exportArchArg
  };

  var exports = [];

  if (exportArg.type === "Literal") {
    exports.push(_.extend({
      name: exportArg.value
    }, exportArch));
  } else if (exportArg.type === "ArrayExpression") {
    _.each(exportArg.elements, function(elem) {
      exports.push(_.extend({
        name: elem.value
      }, exportArch));
    });
  }

  return exports;
};

Analyzer = function() {
  var fs = Npm.require('fs');
  var path = Npm.require('path');
  var esprima = Npm.require('esprima');

  var root = '/home/ag/dev/meteor/packages';

  var packageFolders = fs.readdirSync(root);
  var packages = {};

  _.each(packageFolders || [], function(pkg) {
    var pkgStat = fs.statSync(path.join(root, pkg));

    if (pkgStat.isDirectory()) {
      var packageJsSource;
      try {
        packageJsSource = fs.readFileSync(path.join(root, pkg, 'package.js'));
      } catch (e) {
        return;
      }

      var packageJsTree = esprima.parse(packageJsSource);

      packages[pkg] = {
        _ast: packageJsTree
      };
    }
  });

  this.packages = packages;
};

Analyzer.prototype.getPackageExports = function() {
  var exports = {};

  _.each(this.packages, function(pkg, pkgName) {
    _.each(pkg._ast.body, function(statement) {
      if (isOnUse(statement)) {
        var onUseArgs = statement.expression.arguments;

        var onUseFunc = onUseArgs[0];
        if (onUseFunc && onUseFunc.type === "FunctionExpression") {
          var apiVar = onUseFunc.params[0].name;

          _.each(onUseFunc.body.body, function(statement) {
            if (isExport(statement, apiVar)) {
              var exportsByStatement = parseExport(statement);

              if (!exports[pkgName]) {
                exports[pkgName] = {
                  pkg: pkgName,
                  exports: exportsByStatement
                };
              } else {
                exports[pkgName].exports = exports[pkgName].exports.concat(exportsByStatement);
              }
            }
          });
        }
      }
    });
  });

  this.exports = exports;

  return this.exports;
};

Analyzer.prototype.getPackageUses = function() {
  var uses = {};

  _.each(this.packages, function(pkg, pkgName) {
    _.each(pkg._ast.body, function(statement) {
      if (isOnUse(statement)) {
        var onUseArgs = statement.expression.arguments;

        var onUseFunc = onUseArgs[0];
        if (onUseFunc && onUseFunc.type === "FunctionExpression") {
          var apiVar = onUseFunc.params[0].name;

          _.each(onUseFunc.body.body, function(statement) {
            if (isUse(statement, apiVar)) {
              var usesByStatement = parseUse(statement);

              if (!uses[pkgName]) {
                uses[pkgName] = {
                  pkg: pkgName,
                  uses: usesByStatement
                };
              } else {
                uses[pkgName].uses = uses[pkgName].uses.concat(usesByStatement);
              }
            }
          });
        }
      }
    });
  });

  this.uses = uses;

  return this.uses;
};
