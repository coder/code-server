FROM codercom/code-server:latest

# 设置默认密码（也可以通过 Railway 环境变量覆盖）
ENV PASSWORD=changeme

EXPOSE 8080

CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password"]
