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
	    issue_log += "## " + issue.title + "\n\n";
	    console.log("Adding title");
	    for await (const comment_pages of octokit.paginate.iterator(
		octokit.rest.issues.listComments,
		{
		    owner: github.context.repo.owner,
		    repo: github.context.repo.repo,
		    issue_number: issue.number
		}
	    )) {
		console.log(comment_pages);
		for (const comment of comment_pages.data) {
		    let body = comment.body;
		    if (body.length < 200) {
			issue_log += comment.body;
		    } else {
			issue_log += body.substring(0,199) + " [..more..](" + comment.html_url + ")";
		    }
		}
	    }
	}
    }
    console.log(issue_log);
}

module.exports = {
    build_issue_section
}
