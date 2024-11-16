# ai-reviewer

GitHub Action to review code in a repository using the OpenAI API [OpenAI](https://platform.openai.com)

## Inputs

`OPENAI_API_KEY`: OpenAI API key for GPT.
`OPENAI_ASSISTANT_ID`: OpenAI Assistant ID.
`exclude`: Glob patterns to exclude files from the diff analysis.
`language`: Language of the comments.

## Outputs

`countFiles`: Number of files in the diff.
`countComments`: Number of comments made.
`commentUrl`: URL to the comment.

---

## Example usage

```yaml
on:
  pull_request:
    types:
      - opened
      - synchronize

permissions: write-all

jobs:
  hello_world_job:
    runs-on: ubuntu-latest
    name: AI Action Code Reviewer
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: AI Code Reviewer
        uses: leguass7/ai-reviewer@main
        id: aireviewer
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          OPENAI_ASSISTANT_ID: ${{ secrets.OPENAI_ASSISTANT_ID }}
          exclude: '**/*.json, **/*.md, **/*.map, **/*.lock.json, dist/**/*.js'

      # Use the output step
      - name: Get the output
        run: echo "OUTPUT FILES=${{ steps.aireviewer.outputs.countFiles }}"
```

---

### References

- https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-javascript-action
- https://github.com/actions/typescript-action
- https://github.com/actions/toolkit?tab=readme-ov-file
- https://github.com/DevExpress/testcafe-action/blob/master/index.js
