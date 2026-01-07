FROM coder/code-server:4.96.2

ENV PORT=8080
EXPOSE 8080

CMD ["code-server", \
     "--bind-addr", "0.0.0.0:8080", \
     "--auth", "none"]
