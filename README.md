# Issues to README
A GitHub action to transfer issue comments into a project's README file

Add this file to `.github/workflows/issue2readme.yml`:
```YAML
name: Issues to Readme

on:
  workflow_dispatch:
  issue_comment:

jobs:
  issue2readme:
    runs-on: ubuntu-latest
    name: Transfer issue posts to a section of the front-page
    steps:
      - uses: macroscian/issue2readme@main
```

