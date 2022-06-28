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
    return issue_log;
}

async function set_readme() {
    const old_readme = octokit.rest.repos.getContent({
	owner: github.context.repo.owner,
	repo: github.context.repo.repo,
	path: "readme.md"
    });
    const place_holder="<!--BABSEND-->";
    const { path, sha, content, encoding } = get_readme.data;
    const rawContent = Buffer.from(content, encoding).toString();
    const startIndex = rawContent.indexOf(place_holder);
    const issue_section = build_issue_section();
    const updatedContent = `${startIndex === -1 ? rawContent : rawContent.slice(0, startIndex)}\n${issue_section}`;
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
	owner: github.context.repo.owner,
	repo: github.context.repo.repo,
	path: "readme.md",
	message: 'BABS-bot transferred issues to readme',
	content: updatedContent
    });
}

module.exports = {
    set_readme
}
