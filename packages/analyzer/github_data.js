var githubApi = "https://api.github.com";

Analyzer.readFileGithub = function(path) {
  var resp = HTTP.get(githubApi + path, {
    headers: {
      'User-Agent': 'gandev'
    },
    auth: Meteor.settings.git_api_secret + ':x-oauth-basic'
  });

  if (resp.data && resp.data.type === "file") {
    var fileContent = new Buffer(resp.data.content, 'base64').toString('binary');

    console.log(path);

    return fileContent;
  } else {
    throw new Error(path + " not found!");
  }
};

Analyzer.readDirGithub = function(path) {
  var resp = HTTP.get(githubApi + path, {
    headers: {
      'User-Agent': 'gandev'
    },
    auth: Meteor.settings.git_api_secret + ':x-oauth-basic'
  });

  if (resp.data && resp.data instanceof Array) {
    var files = [];
    _.each(resp.data, function(file) {
      files.push({
        name: file.name,
        isDirectory: file.type === "dir"
      });
    });

    return files;
  } else {
    throw new Error(path + " not found!");
  }
};