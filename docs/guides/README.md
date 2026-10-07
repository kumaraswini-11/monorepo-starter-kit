# Guides — how to work in this repository

The ADRs in [`../decisions/`](../decisions/) record **why** things are the way they are. These
guides record **how** to do the recurring tasks, and point at the governing ADR instead of
repeating it. Keep each guide short; when a guide needs a paragraph of reasoning, that reasoning
belongs in an ADR.

| Guide                                           | Use it when                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| [Repository structure](repository-structure.md) | you need to know where something lives and why                    |
| [Adding a package](adding-a-package.md)         | you are creating a workspace package                              |
| [Adding an app](adding-an-app.md)               | you are creating a deployable application                         |
| [Dependencies](dependencies.md)                 | you add, bump, or remove a third-party dependency                 |
| [Environment](environment.md)                   | you add or read configuration / secrets                           |
| [Testing](testing.md)                           | you write or run unit, component, integration, e2e or story tests |
| [CI/CD](ci-cd.md)                               | you touch the pipeline, the gates, or repository governance       |
| [Release](release.md)                           | you ship, tag, or need a changelog                                |

Periodic re-evaluations of the foundation live in [`../audits/`](../audits/).
