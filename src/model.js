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
	    repo: github.context.repo.repo,
	    state: "all"
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
		    console.log(comment);
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
    const old_readme = await octokit.rest.repos.getContent({
	owner: github.context.repo.owner,
	repo: github.context.repo.repo,
	path: "readme.md"
    });
    const issue_start="<!--ISSUE_START-->";
    const issue_end="<!--ISSUE_START-->";
    const place_holder="<!--BABSEND-->";
    const { path, sha, content, encoding } = old_readme.data;
    const rawContent = Buffer.from(content, encoding).toString();
    var startIndex = rawContent.indexOf(issue_start);
    const issue_section = await build_issue_section();
    var updatedContent=rawContent;
    if (startIndex === -1) {
	start_index = rawContent.indexOf(place_holder);
	var updatedContent = updatedContent.replace(place_holder, `${place_holder}\n${issue_start}\n${issue_section}\n${issue_end}`);
    } else {
	var end_index=rawContent.indexOf(issue_end);
	updatedContent = rawContent.slice(0, rawContent.indexOf(issue_start)) + issue_start + '\n' + issue_section + '\n'  + rawContent.slice(rawContent.indexOf(issue_end));
    }
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
	owner: github.context.repo.owner,
	repo: github.context.repo.repo,
	path: "readme.md",
	sha: sha,
	message: 'BABS-bot transferred issues to readme',
	content: Buffer.from(updatedContent, "utf-8").toString(encoding)
    });
}

module.exports = {
    set_readme
}
