const core = require('@actions/core');
const model = require('./model.js');


async function main() {
    try {
	console.log("Initializing labels");
	await model.build_issue_section();
    } catch (error) {
	core.setFailed(error.message);
    }
}

main()
