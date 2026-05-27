# Contributing to datapitfalls

## A note from Ben

Hi — I'm Ben Jones, and I'm genuinely glad you're here.

I've spent the better part of two decades teaching people to work with data, and the one thing I keep coming back to is this: the mistakes we make with data are *patterned*. They repeat. They have names. And once you can name a pitfall, you can learn to avoid it. That's the whole idea behind this project — to turn that hard-won, scattered knowledge into a tool that helps everyone catch the blunders before they ship.

No single person can map every pitfall in every domain. This project gets better when practitioners from statistics, engineering, design, journalism, science, and beyond bring their own war stories and fixes to the table. That's why your contribution matters. Whether you're fixing a typo, sharpening a detection rule, or proposing an entire new category of pitfall, you're helping people work with data more honestly. Thank you.

— Ben

---

## Ways to contribute

There's room for every kind of help here:

- **Report a bug** so we can fix it.
- **Suggest a feature** that would make the tool more useful.
- **Propose a new pitfall rule** — this is the heart of the project.
- **Improve the docs** — clarity is a feature.
- **Write code** — implement, refactor, test.

---

## Reporting bugs

Found something broken? Please [open a bug report](https://github.com/bjonesdataliteracy/datapitfalls/issues/new?template=bug_report.md) using our bug report template. The more specific you can be — steps to reproduce, what you expected, what actually happened — the faster we can fix it.

For anything security-related, **do not open a public issue**. Follow the process in [SECURITY.md](SECURITY.md) instead.

---

## Suggesting features

Have an idea? [Open a feature request](https://github.com/bjonesdataliteracy/datapitfalls/issues/new?template=feature_request.md). Tell us the problem you're trying to solve, not just the solution you have in mind — that gives us the most room to find the best path together.

---

## Contributing pitfall rules

This is the part I'm most excited about. The pitfall taxonomy is the brain of datapitfalls, and it grows through community knowledge.

A **pitfall rule** is a structured, machine-readable description of one specific way data work can go wrong. Every rule lives in one of the eight pitfall domains:

1. Epistemic Errors
2. Technical Trespasses
3. Mathematical Miscues
4. Statistical Slip-Ups
5. Analytical Aberrations
6. Graphical Gaffes
7. Design Dangers
8. Biased Baseline

Each rule has a defined shape — `id`, `name`, `domain`, `severity`, `description`, `detection_strategy`, `example_bad`, `example_good`, `remediation`, and `references`. The full specification, with worked examples, lives in [docs/PITFALL_TAXONOMY.md](docs/PITFALL_TAXONOMY.md). **Please read that document before proposing a rule** — it'll show you exactly what a good rule looks like.

To propose a new rule:

1. [Open a "New pitfall rule" issue](https://github.com/bjonesdataliteracy/datapitfalls/issues/new?template=new_pitfall_rule.md) so we can discuss it before code is written.
2. Describe the pitfall, how the tool might detect it, and a real-world example.
3. Once we've talked it through, you (or a maintainer) can submit a PR adding the rule to the taxonomy.

Good pitfall rules are **specific** (one clear failure mode), **detectable** (there's a plausible way to spot it), and **grounded** (you can point to where it shows up in the wild).

---

## Submitting a pull request

We use the standard fork-and-branch workflow:

1. **Fork** the repository to your own account.
2. **Clone** your fork locally.
3. **Create a branch** with a descriptive name:
   ```bash
   git checkout -b feat/add-simpsons-paradox-rule
   ```
4. **Make your changes**, following the code style below.
5. **Commit** using [conventional commits](#commit-message-conventions).
6. **Push** your branch to your fork.
7. **Open a pull request** against the `main` branch using the [PR template](.github/PULL_REQUEST_TEMPLATE.md).

Reference any related issue in your PR description (e.g. `Closes #42`). A maintainer will review, and we'll iterate together until it's ready to merge.

---

## Code style and conventions

datapitfalls is written in **TypeScript**, with **Prettier** for formatting and **ESLint** for linting. The configs live at the repo root.

- Run the formatter before committing:
  ```bash
  npm run format
  ```
- Run the linter:
  ```bash
  npm run lint
  ```
- Prefer clear, readable code over clever code. This is a project people will learn from.
- Keep functions focused and well-named. Comment the *why*, not the *what*.

---

## Commit message conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/). The format is:

```
<type>: <short description>
```

Common types:

| Type       | Use for                                          |
| ---------- | ------------------------------------------------ |
| `feat:`    | A new feature or capability                      |
| `fix:`     | A bug fix                                         |
| `docs:`    | Documentation changes only                       |
| `refactor:`| Code changes that neither fix a bug nor add a feature |
| `test:`    | Adding or updating tests                         |
| `chore:`   | Tooling, config, dependencies, housekeeping      |

Examples:

```
feat: add survivorship-bias detection rule
fix: correct severity mapping for truncated-y-axis
docs: clarify taxonomy rule format with R example
```

---

## Licensing of contributions

By contributing to datapitfalls, you agree that your contributions will be licensed under the [MIT License](LICENSE), the same license that covers the project. You confirm that you have the right to submit the work under that license.

---

Thanks again for being part of this. Let's help the world avoid a few data pitfalls together.
