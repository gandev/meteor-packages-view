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

var isApiFunction = function(statement, func, apiVar) {
  if (!isMemberExpression(statement)) return;

  var callee = statement.expression.callee;

  return callee.object.name === apiVar &&
    callee.property.name === func;
};

var parseApiFunctionArgs = function(statement) {
  var firstArg = statement.expression.arguments[0] || {};
  var secondArg = statement.expression.arguments[1] || {};
  var thirdArg = statement.expression.arguments[2] || {};

  var options = [];

  var arch = ["anywhere"];
  if (secondArg.type === "Literal") {
    arch = [secondArg.value];
  } else if (secondArg.type === "ArrayExpression") {
    arch = _.map(secondArg.elements,
      function(elem) {
        return elem.value;
      });
  }

  if (secondArg.type === "ObjectExpression" || thirdArg && thirdArg.type === "ObjectExpression") {
    _.each(secondArg.properties || thirdArg.properties, function(prop) {
      if (prop.value.type === "Literal") {
        options.push({
          name: prop.key.name,
          value: prop.value.value
        });
      }
    });
  }

  var results = [];
  if (firstArg.type === "Literal") {
    results.push(_.extend({
      name: firstArg.value
    }, {
      arch: arch,
      options: options
    }));
  } else if (firstArg.type === "ArrayExpression") {
    _.each(firstArg.elements, function(elem) {
      results.push(_.extend({
        name: elem.value
      }, {
        arch: arch,
        options: options
      }));
    });
  }

  return results;
};

Analyzer = function() {
  var fs = Npm.require('fs');
  var path = Npm.require('path');
  var esprima = Npm.require('esprima');

  var root = '/Users/ares/dev/js/meteor/packages';

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
        _ast: packageJsTree,
        name: pkg,
        exports: [],
        uses: [],
        imply: [],
        files: []
      };
    }
  });

  this.packages = packages;

  this._analyze();
};

Analyzer.prototype._analyze = function() {
  var self = this;

  _.each(this.packages, function(pkg, pkgName) {
    _.each(pkg._ast.body, function(statement) {
      if (isOnUse(statement)) {
        var onUseArgs = statement.expression.arguments;

        var onUseFunc = onUseArgs[0];
        if (onUseFunc && onUseFunc.type === "FunctionExpression") {
          var apiVar = onUseFunc.params[0].name;

          var pkgObj = self.packages[pkgName];

          _.each(onUseFunc.body.body, function(statement) {
            if (isApiFunction(statement, "export", apiVar)) {
              pkgObj.exports = pkgObj.exports.concat(parseApiFunctionArgs(statement));
            }

            if (isApiFunction(statement, "use", apiVar)) {
              pkgObj.uses = pkgObj.uses.concat(parseApiFunctionArgs(statement));
            }

            if (isApiFunction(statement, "imply", apiVar)) {
              pkgObj.imply = pkgObj.imply.concat(parseApiFunctionArgs(statement));
            }

            if (isApiFunction(statement, "addFiles", apiVar) ||
              isApiFunction(statement, "add_files", apiVar)) {
              pkgObj.files = pkgObj.files.concat(parseApiFunctionArgs(statement));
            }
          });
        }
      }
    });
  });
};

Analyzer.prototype.getPackages = function() {
  return this.packages;
};
