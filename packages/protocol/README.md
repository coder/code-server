# Protocol

This module provides a way for the browser to run Node modules like `fs`, `net`,
etc.

## Internals

### Server-side proxies
The server-side proxies are regular classes that call native Node functions. The
only thing special about them is that they must return promises and they must
return serializable values.

The only exception to the promise rule are event-related methods such as
`onEvent` and `onDone` (these are synchronous). The server will simply
immediately bind and push all events it can to the client. It doesn't wait for
the client to start listening. This prevents issues with the server not
receiving the client's request to start listening in time.

However, there is a way to specify events that should not bind immediately and
should wait for the client to request it, because some events (like `data` on a
stream) cannot be bound immediately (because doing so changes how the stream
behaves).

### Client-side proxies
Client-side proxies are `Proxy` instances. They simply make remote calls for any
method you call on it. The only exception is for events. Each client proxy has a
local emitter which it uses in place of a remote call (this allows the call to
be completed synchronously on the client). Then when an event is received from
the server, it gets emitted on that local emitter.

When an event is listened to, the proxy also notifies the server so it can start
listening in case it isn't already (see the `data` example above). This only
works for events that only fire after they are bound.

### Client-side fills
The client-side fills implement the Node API and make calls to the server-side
proxies using the client-side proxies.

When a proxy returns a proxy (for example `fs.createWriteStream`), that proxy is
a promise (since communicating with the server is asynchronous). We have to
return the fill from `fs.createWriteStream` synchronously, so that means the
fill has to contain a proxy promise. To eliminate the need for calling `then`
and to keep the code looking clean every time you use the proxy, the proxy is
itself wrapped in another proxy which just calls the method after a `then`. This
works since all the methods return promises (aside from the event methods, but
those are not used by the fills directly—they are only used internally to
forward events to the fill if it is an event emitter).
