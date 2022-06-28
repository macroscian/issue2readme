const core = require('@actions/core');
const model = require('./model.js');


async function main() {
    try {
	console.log("Initializing labels");
	const issue_body = await model.set_readme();
    // 	core.setOutput('issue_body', issue_body);
    } catch (error) {
	core.setFailed(error.message);
    }
}

main()
