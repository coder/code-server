# server

## Endpoints

### `/tunnel/<port>`

Tunnels a TCP connection over WebSockets. Implemented for proxying connections from a remote machine locally.

### `/ports`

Watches for open ports. Implemented for tunneling ports on the remote server.

### `/resource/<url>`

Reads files on GET.
Writes files on POST.