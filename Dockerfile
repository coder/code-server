FROM coder/code-server:latest

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:8080/ || exit 1

CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password"]
