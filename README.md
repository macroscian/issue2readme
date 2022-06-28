# Issues to README
A GitHub action to transfer issue comments into a project's README file

Add this file to `.github/workflows/issue2readme.yml`:
```YAML
name: Issues to Readme

on: 
  workflow_dispatch:
  issues:
    types: [closed]
  pull_request_target: 
    types: [opened, edited]
    
jobs: 
  issue2readme: 
    runs-on: ubuntu-latest
    name: Transfer issue posts to a section of the front-page
    
    steps: 
      - uses: actions/checkout@v3
      - name: Create issue text
	    id : issue2txt
	    uses: macroscian/issues2readme@main
	  - name: Insert text into readme
	    id: txt2readme
		run: bash .github/scripts/issue2readme.sh 
```

