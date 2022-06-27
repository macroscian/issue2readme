const core = require('@actions/core');
const github = require('@actions/github');
const token = core.getInput("token");
const octokit = github.getOctokit(token);


async function build_issue_section() {
    console.log("Getting issues");
    var issue_log = "";
    for await (const response of octokit.paginate.iterator(
	octokit.rest.issues.listForRepo,
	{
	    owner: github.context.repo.owner,
	    repo: github.context.repo.repo
	}
    )) {
	issue_log += "## " + response.data.title + "\n\n";
	console.log(response.data.tile);
	for await (const comment of octokit.paginate.iterator(
	    octokit.rest.issues.listComments,
	    {
		owner: github.context.repo.owner,
		repo: github.context.repo.repo,
		issue_number: response.data.id
	    })) {
	    let body = comment.data.body;
	    console.log(comment.data.tile);
	    if (body.length < 200) {
		issue_log += comment.data.body;
	    } else {
		issue_log += body.substring(0,199) + " [..more..](" + comment.data.html_url + ")";
	    }
	}
    }
}

module.exports = {
    build_issue_section
}
