# Use the official Node.js image as the base image
FROM node:16-slim

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install code-server using the custom install.sh script
COPY install.sh /install.sh
RUN bash /install.sh --method standalone --prefix /usr/local

# Expose the port that code-server will run on
EXPOSE 8080

# Set the environment variable for code-server
ENV PASSWORD="your_password_here"

# Command to run code-server
CMD ["code-server", "--host", "0.0.0.0", "--port", "8080"]
