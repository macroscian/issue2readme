const core = require('@actions/core');
const github = require('@actions/github');
const token = core.getInput("token");
const octokit = github.getOctokit(token);


async function build_issue_section() {
    console.log("Getting issues");
    var issue_log = '# Issues\n\n';
    var issue_heading = false;
    for await (const issue_pages of octokit.paginate.iterator(
	octokit.rest.issues.listForRepo,
	{
	    owner: github.context.repo.owner,
	    repo: github.context.repo.repo,
	    state: "all"
	}
    )) {
	for (const issue of issue_pages.data) {
	    issue_heading = false;
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
		    if (comment.user.login !=='github-actions[bot]')  {
			if (issue_heading==false) {
			    issue_log += "## " + issue.title + '\n\n';
			    issue_heading=true;
			}
			let body = comment.body;
			// Find end of the first sentence after 200 chars
			let detail_ind = [...body.matchAll(new RegExp('[.!?] ', 'g'))].map(a => a.index).find(pos => pos > 200);
			issue_log += '\n\n- [' + comment.updated_at + '](' + comment.html_url + ')\n\n'
			if (detail_ind === undefined) {
			    issue_log += comment.body + '\n';
			} else {
			    issue_log += "<details><summary>"+ body.substring(0,detail_ind) + "</summary>" + body.substring(detail_ind)  + "</details>" + '\n';
			}
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
    const issue_end="<!--ISSUE_END-->";
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
