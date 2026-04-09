# stackpulse

> A CLI tool that monitors and summarizes GitHub PR activity across multiple repos in one view.

---

## Installation

```bash
npm install -g stackpulse
```

Or run directly with npx:

```bash
npx stackpulse
```

---

## Usage

Authenticate with your GitHub token, then pass one or more repos to monitor:

```bash
stackpulse --token ghp_yourtoken --repos owner/repo1 owner/repo2
```

**Example output:**

```
owner/repo1   ●  3 open PRs  |  2 awaiting review  |  1 merged today
owner/repo2   ●  1 open PR   |  0 awaiting review  |  4 merged today
```

### Options

| Flag | Description |
|------|-------------|
| `--token` | GitHub personal access token |
| `--repos` | Space-separated list of `owner/repo` targets |
| `--interval` | Polling interval in seconds (default: `60`) |
| `--watch` | Keep running and refresh on interval |

```bash
# Watch mode, refresh every 30 seconds
stackpulse --token ghp_yourtoken --repos owner/repo1 --watch --interval 30
```

---

## Configuration

You can store defaults in a `.stackpulse.json` file in your home directory:

```json
{
  "token": "ghp_yourtoken",
  "repos": ["owner/repo1", "owner/repo2"],
  "interval": 60
}
```

---

## License

[MIT](LICENSE)