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
	    [out, issue_heading] = log_text(issue, issue, issue_heading);
	    issue_log += out;
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
		    [out, issue_heading] = log_text(comment, issue, issue_heading);
		    issue_log += out;
		}
	    }
	}
    }
    return issue_log;
}

function log_text(gh, issue, issue_heading) {
    var out="";
    if (gh.user.login !=='github-actions[bot]')  {
	if (issue_heading==false) {
	    out += "## " + issue.title + '\n\n';
	    issue_heading=true;
	}
	let body = gh.body;
	// Find end of the first sentence after 200 chars
	let detail_ind = [...body.matchAll(new RegExp('[.!?] ', 'g'))].map(a => a.index).find(pos => pos > 200);
	out += '\n\n- [' + gh.updated_at + '](' + gh.html_url + ')\n\n'
	if (detail_ind === undefined) {
	    out += gh.body + '\n';
	} else {
	    out += "<details><summary>"+ body.substring(0,detail_ind+1) + "...</summary>" + body.substring(detail_ind+1)  + "</details>" + '\n';
	}
    }
    return [out, issue_heading];
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
    const issue_link="[Issue History](.github/issues.md)";
    const { path, sha, content, encoding } = old_readme.data;
    const rawContent = Buffer.from(content, encoding).toString();
    const issue_section = await build_issue_section();
    var updatedContent=rawContent;
    if (rawContent.indexOf(issue_link) === -1) { //No Issue Link
	if (rawContent.indexOf(issue_start) === -1) { // and no issue div
	    updatedContent = updatedContent.replace(place_holder, `${place_holder}\n${issue_start}\n[Issue History](.github/issues.md)\n${issue_end}`);
	} else { // No link, but other issue content (legacy issue list injected, probably)
	    updatedContent = rawContent.slice(0, rawContent.indexOf(issue_start)) + issue_start + '\n[Issue History](.github/issues.md)\n'  + rawContent.slice(rawContent.indexOf(issue_end));
	}
	await octokit.repos.createOrUpdateFileContents({
	    owner: github.context.repo.owner,
	    repo: github.context.repo.repo,
	    path: "readme.md",
	    sha: sha,
	    message: 'BABS-bot inserted issue link into reame',
	    content: Buffer.from(updatedContent, "utf-8").toString(encoding)
	});
    }
    const old_issue = await octokit.rest.repos.getContent({
	owner: github.context.repo.owner,
	repo: github.context.repo.repo,
	path: ".github/issues.md"
    });
    if (old_issue.hasOwnProperty('data')) {
	const { ispath, issha, iscontent, isencoding } = old_issue.data;
	await octokit.repos.createOrUpdateFileContents({
	    owner: github.context.repo.owner,
	    repo: github.context.repo.repo,
	    path: ".github/issues.md",
	    sha: issha,
	    message: 'BABS-bot refreshed issues.md page',
	    content: Buffer.from(issue_section, "utf-8").toString(encoding)
	});
    } else {
	await octokit.repos.createOrUpdateFileContents({
	    owner: github.context.repo.owner,
	    repo: github.context.repo.repo,
	    path: ".github/issues.md",
	    message: 'BABS-bot refreshed issues.md page',
	    content: Buffer.from(issue_section, "utf-8").toString(encoding)
	});

    }
}

module.exports = {
    set_readme
}
