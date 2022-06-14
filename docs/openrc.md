This script is pretty generic and should be able to run on any OpenRC-based distribution with minimal tweaks.

Save the file as `code-server` in `/etc/init.d` and make it executable with `chmod +x code-server`. Put your username in line 3.

```bash
name=$RC_SVCNAME
description="$name - VS Code on a remote server"
user="" # your username here
homedir="/home/$user"
command="$(which code-server)"
# Just because you can do this does not mean you should. Use ~/.config/code-server/config.yaml instead
#command_args="--extensions-dir $homedir/.local/share/$name/extensions --user-data-dir $homedir/.local/share/$name --disable-telemetry"
command_user="$user:$user"
pidfile="/run/$name/$name.pid"
command_background="yes"
extra_commands="report"

depend() {
	use logger dns
	need net
}

start_pre() {
	checkpath --directory --owner $command_user --mode 0755 /run/$name /var/log/$name
}

start() {
	default_start
	report
}

stop() {
	default_stop
}

status() {
	default_status
	report
}

report() {
	# Report to the user
	einfo "Reading configuration from ~/.config/code-server/config.yaml"
}
```

Start on boot with default runlevel
```
rc-update add code-server default
```

Start the service immediately
```
rc-service code-server start
```
