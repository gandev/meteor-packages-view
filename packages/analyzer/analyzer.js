var fs = Npm.require('fs');
var path = Npm.require('path');
var esprima = Npm.require('esprima');
var escope = Npm.require('escope');

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

Analyzer = function(root) {
  var packageFolders = fs.readdirSync(root);
  var packages = {};

  _.each(packageFolders || [], function(pkg) {
    var packagePath = path.join(root, pkg);
    var pkgStat = fs.statSync(packagePath);

    if (pkgStat.isDirectory()) {
      var packageJsSource;
      try {
        packageJsSource = fs.readFileSync(path.join(packagePath, 'package.js'));
      } catch (e) {
        return;
      }

      var packageJsTree = esprima.parse(packageJsSource);

      packages[pkg] = {
        _ast: packageJsTree,
        name: pkg,
        folder: packagePath,
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

  _.each(this.packages, function(pkg) {
    //TODO use estraverse !?
    _.each(pkg._ast.body, function(statement) {
      if (isOnUse(statement)) {
        var onUseArgs = statement.expression.arguments;

        var onUseFunc = onUseArgs[0];
        if (onUseFunc && onUseFunc.type === "FunctionExpression") {
          var apiVar = onUseFunc.params[0].name;

          _.each(onUseFunc.body.body, function(statement) {
            if (isApiFunction(statement, "export", apiVar)) {
              pkg.exports = pkg.exports.concat(parseApiFunctionArgs(statement));
            }

            if (isApiFunction(statement, "use", apiVar)) {
              pkg.uses = pkg.uses.concat(parseApiFunctionArgs(statement));
            }

            if (isApiFunction(statement, "imply", apiVar)) {
              pkg.imply = pkg.imply.concat(parseApiFunctionArgs(statement));
            }

            if (isApiFunction(statement, "addFiles", apiVar) ||
              isApiFunction(statement, "add_files", apiVar)) {
              pkg.files = pkg.files.concat(parseApiFunctionArgs(statement));
            }
          });
        }
      }
    });
  });

  //TODO link globals to definition/exports
  _.each(this.packages, function(pkg) {
    _.each(pkg.files, function(file) {
      if (/\.js$/i.test(file.name)) {
        var fileContent = fs.readFileSync(path.join(pkg.folder, file.name));

        var content = "(function(){\n" + fileContent + "\n})();";

        var ast = esprima.parse(content, {
          range: true,
          loc: true
        });
        var scopes = escope.analyze(ast).scopes;

        file.globals = _.map(scopes[0].through, function(ref) {
          return {
            name: ref.identifier.name,
            line: ref.identifier.loc.start.line - 1
          };
        });
      }
    });
  });
};

Analyzer.prototype.getPackages = function() {
  return this.packages;
};
