function populateGithubProjects(rtn) {
  var repos = rtn.repositories;
  var maxRepos = 15;
  var str = '<div class="bubble"><h3>GitHub Projects</h3><ul>';
  for (var i=0, l=repos.length; i<l; i++) {
    if (i == maxRepos) break;
    var repo = repos[i];
    str += '<li><a href="'+repo.url+'">'+repo.name+'</a> - '+repo.description;
    if (repo.homepage) {
      str += '<span class="versiontag"><a href="'+repo.homepage+'">Homepage</a></span>';
    }
    str += '</li>';
  }
  str += '</ul></div>';
  document.write(str);
}
