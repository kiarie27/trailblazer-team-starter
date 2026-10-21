# Architecture sketch

Fill this in on Day 2. The worked example shows the practice app and the sandbox.

## Worked example: the practice app

```
[ Browser: public/index.html + app.js ]
            |  fetch over the internet
            v
==================  trust boundary  ==================
            |
            v
[ Server: Moringa Pesa Sandbox, sandbox/app.js ]
            |
            v
[ Data: practice accounts, sandbox/accounts.js ]
```

Anything above the trust boundary can be changed by the user, so the browser never decides whether a transfer is allowed. The server checks every request.

## Our product

Draw your own: the interface, where the data comes from, the service layer, and where the trust boundary is.

```
[ Interface: ]
        |
        v
=========  trust boundary  =========
        |
        v
[ Service layer: ]
        |
        v
[ Data: ]
```

What must the interface never decide?

-
