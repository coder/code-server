FROM coder/code-server:latest

COPY health-server.js /health-server.js

EXPOSE 8080 3000

CMD sh -c "node /health-server.js & code-server --bind-addr 0.0.0.0:8080 --auth password"
