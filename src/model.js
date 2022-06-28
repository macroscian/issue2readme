const core = require('@actions/core');
const github = require('@actions/github');
const token = core.getInput("token");
const octokit = github.getOctokit(token);


async function build_issue_section() {
    console.log("Getting issues");
    var issue_log = "";
    for await (const issue_pages of octokit.paginate.iterator(
	octokit.rest.issues.listForRepo,
	{
	    owner: github.context.repo.owner,
	    repo: github.context.repo.repo
	}
    )) {
	for (const issue of issue_pages.data) {
	    console.log("Adding title");
	    console.log(issue);
	    issue_log += "## " + issue.title + "\n\n";
	    for await (const comment_pages of octokit.paginate.iterator(
		octokit.rest.issues.listComments,
		{
		    owner: github.context.repo.owner,
		    repo: github.context.repo.repo,
		    issue_number: issue.id
		}
	    )) {
		console.log(comment_pages);
		for (const comment of comment_pages.data) {
		    let body = comment.data.body;
		    console.log(comment.data.tile);
		    if (body.length < 200) {
			issue_log += comment.body;
		    } else {
			issue_log += body.substring(0,199) + " [..more..](" + comment.html_url + ")";
		    }
		}
	    }
	}
    }
}

module.exports = {
    build_issue_section
}
