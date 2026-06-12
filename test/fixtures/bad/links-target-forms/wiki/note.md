# Target Forms

Three valid forms the old extractor/target test broke on — check-links must pass all of them:

- directory target: [deliverables](../deliverables/) — the `-f` test flagged real directories
- titled link: [decisions](./decisions.md "project decisions") — the python regex grabbed the title into the target
- fenced example below — invisible to a real parser:

```
[example](./does-not-exist.md)
```
