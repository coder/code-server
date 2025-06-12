# Login Page Customization

code-server allows you to customize the login page appearance and messages through CLI arguments, environment variables, or configuration files.

## Available Customization Options

### Branding and Appearance
- **Login Title**: Customize the main title on the login page
- **Welcome Text**: Set custom welcome message  
- **App Name**: Change the application branding throughout the interface

### Login Messages
- **Password Instructions**: Customize the message explaining where to find the password
- **Environment Password Message**: Custom message when password is set via `$PASSWORD`
- **Hashed Password Message**: Custom message when password is set via `$HASHED_PASSWORD`

### Form Elements
- **Password Placeholder**: Custom placeholder text for the password field
- **Submit Button**: Custom text for the login button

### Error Messages
- **Rate Limit Message**: Custom message when login attempts are rate limited
- **Missing Password**: Custom message for empty password submissions
- **Incorrect Password**: Custom message for wrong password attempts

## Configuration Methods

### CLI Arguments

```bash
code-server \
  --app-name "My Development Server" \
  --welcome-text "Welcome to the development environment" \
  --login-title "Secure Access Portal" \
  --login-below "Please authenticate to continue" \
  --password-placeholder "Enter your access code" \
  --submit-text "AUTHENTICATE" \
  --login-env-password-msg "Access code provided via environment variable" \
  --login-rate-limit-msg "Too many attempts. Please wait before trying again." \
  --missing-password-msg "Access code is required" \
  --incorrect-password-msg "Invalid access code"
```

### Environment Variables

Perfect for Docker deployments and containerized environments:

```bash
# Basic branding
export CS_APP_NAME="My Development Server"
export CS_WELCOME_TEXT="Welcome to the development environment"

# Login page customization
export CS_LOGIN_TITLE="Secure Access Portal"
export CS_LOGIN_BELOW="Please authenticate to continue"
export CS_PASSWORD_PLACEHOLDER="Enter your access code"
export CS_SUBMIT_TEXT="AUTHENTICATE"

# Message customization
export CS_LOGIN_ENV_PASSWORD_MSG="Access code provided via environment variable"
export CS_LOGIN_RATE_LIMIT_MSG="Too many attempts. Please wait before trying again."
export CS_MISSING_PASSWORD_MSG="Access code is required"
export CS_INCORRECT_PASSWORD_MSG="Invalid access code"

code-server
```

### Configuration File

Add to your `~/.config/code-server/config.yaml`:

```yaml
bind-addr: 127.0.0.1:8080
auth: password
password: your-password

# Branding
app-name: "My Development Server"
welcome-text: "Welcome to the development environment"

# Login page
login-title: "Secure Access Portal"
login-below: "Please authenticate to continue"
password-placeholder: "Enter your access code"
submit-text: "AUTHENTICATE"

# Messages
login-env-password-msg: "Access code provided via environment variable"
login-rate-limit-msg: "Too many attempts. Please wait before trying again."
missing-password-msg: "Access code is required"
incorrect-password-msg: "Invalid access code"
```

## Docker Examples

### Basic Docker Deployment with Customization

```bash
docker run -it --name code-server -p 127.0.0.1:8080:8080 \
  -v "$PWD:/home/coder/project" \
  -e "CS_LOGIN_TITLE=Development Environment" \
  -e "CS_LOGIN_ENV_PASSWORD_MSG=Password configured in container environment" \
  -e "CS_PASSWORD_PLACEHOLDER=Enter development password" \
  -e "CS_SUBMIT_TEXT=ACCESS ENVIRONMENT" \
  codercom/code-server:latest
```

### Corporate Branding Example

```bash
docker run -it --name code-server -p 127.0.0.1:8080:8080 \
  -v "$PWD:/home/coder/project" \
  -e "CS_APP_NAME=ACME Corporation Dev Portal" \
  -e "CS_LOGIN_TITLE=ACME Development Portal" \
  -e "CS_LOGIN_BELOW=Enter your corporate credentials" \
  -e "CS_PASSWORD_PLACEHOLDER=Corporate Password" \
  -e "CS_SUBMIT_TEXT=SIGN IN" \
  -e "CS_LOGIN_ENV_PASSWORD_MSG=Password managed by IT department" \
  codercom/code-server:latest
```

## Priority Order

Settings are applied in the following priority order (highest to lowest):

1. **CLI arguments** - Highest priority
2. **Environment variables** - Medium priority  
3. **Config file** - Lowest priority

This allows you to set defaults in your config file and override them with environment variables or CLI arguments as needed.

## Complete Reference

| CLI Argument | Environment Variable | Description |
|--------------|---------------------|-------------|
| `--app-name` | `CS_APP_NAME` | Application name used throughout the interface |
| `--welcome-text` | `CS_WELCOME_TEXT` | Welcome message on login page |
| `--login-title` | `CS_LOGIN_TITLE` | Main title on login page |
| `--login-below` | `CS_LOGIN_BELOW` | Text below the login title |
| `--password-placeholder` | `CS_PASSWORD_PLACEHOLDER` | Password field placeholder text |
| `--submit-text` | `CS_SUBMIT_TEXT` | Login button text |
| `--login-password-msg` | `CS_LOGIN_PASSWORD_MSG` | Message for config file password |
| `--login-env-password-msg` | `CS_LOGIN_ENV_PASSWORD_MSG` | Message when using `$PASSWORD` env var |
| `--login-hashed-password-msg` | `CS_LOGIN_HASHED_PASSWORD_MSG` | Message when using `$HASHED_PASSWORD` env var |
| `--login-rate-limit-msg` | `CS_LOGIN_RATE_LIMIT_MSG` | Rate limiting error message |
| `--missing-password-msg` | `CS_MISSING_PASSWORD_MSG` | Empty password error message |
| `--incorrect-password-msg` | `CS_INCORRECT_PASSWORD_MSG` | Wrong password error message |