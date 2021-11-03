workflow "Autorebase branch on merge commits" {
	on = "push"
	resolves = ["rebase"]
}

workflow "Autorebase PR on merge commits" {
	on = "pull_request"
	resolves = ["rebase"]
}

 action "rebase" {
	uses = "ljharb/rebase@latest"
	secrets = ["GITHUB_TOKEN"]
}
