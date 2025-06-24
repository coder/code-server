# Login Page Customization

code-server allows you to customize the login page appearance and messages through a unified `--custom-strings` flag or legacy CLI arguments.

## Recommended Approach: Custom Strings

The `--custom-strings` flag provides a scalable way to customize any UI text by leveraging the built-in internationalization system.

### Using JSON File

Create a JSON file with your customizations:

```json
{
  "WELCOME": "Welcome to {{app}} Development Portal",
  "LOGIN_TITLE": "{{app}} Secure Access",
  "LOGIN_BELOW": "Please authenticate to continue",
  "PASSWORD_PLACEHOLDER": "Enter your access code",
  "SUBMIT": "AUTHENTICATE",
  "LOGIN_PASSWORD": "Check the config file at {{configFile}} for the password.",
  "LOGIN_USING_ENV_PASSWORD": "Access code provided via environment variable",
  "LOGIN_USING_HASHED_PASSWORD": "Access code configured securely",
  "LOGIN_RATE_LIMIT": "Too many attempts. Please wait before trying again.",
  "MISS_PASSWORD": "Access code is required",
  "INCORRECT_PASSWORD": "Invalid access code"
}
```

```bash
code-server --custom-strings /path/to/custom-strings.json
```

### Using Inline JSON

```bash
code-server --custom-strings '{"WELCOME": "Welcome to My Dev Portal", "LOGIN_TITLE": "Development Access", "SUBMIT": "SIGN IN"}'
```

### Configuration File

Add to your `~/.config/code-server/config.yaml`:

```yaml
bind-addr: 127.0.0.1:8080
auth: password
password: your-password
custom-strings: |
  {
    "WELCOME": "Welcome to {{app}} Development Portal",
    "LOGIN_TITLE": "{{app}} Secure Access",
    "PASSWORD_PLACEHOLDER": "Enter your access code",
    "SUBMIT": "AUTHENTICATE"
  }
```

## Available Customization Keys

| Key | Description | Default | Supports {{app}} placeholder |
|-----|-------------|---------|------------------------------|
| `WELCOME` | Welcome message on login page | "Welcome to {{app}}" | ✅ |
| `LOGIN_TITLE` | Main title on login page | "{{app}} login" | ✅ |
| `LOGIN_BELOW` | Text below the login title | "Please log in below." | ❌ |
| `PASSWORD_PLACEHOLDER` | Password field placeholder text | "PASSWORD" | ❌ |
| `SUBMIT` | Login button text | "SUBMIT" | ❌ |
| `LOGIN_PASSWORD` | Message for config file password | "Check the config file at {{configFile}} for the password." | ❌ |
| `LOGIN_USING_ENV_PASSWORD` | Message when using `$PASSWORD` env var | "Password was set from $PASSWORD." | ❌ |
| `LOGIN_USING_HASHED_PASSWORD` | Message when using `$HASHED_PASSWORD` env var | "Password was set from $HASHED_PASSWORD." | ❌ |
| `LOGIN_RATE_LIMIT` | Rate limiting error message | "Login rate limited!" | ❌ |
| `MISS_PASSWORD` | Empty password error message | "Missing password" | ❌ |
| `INCORRECT_PASSWORD` | Wrong password error message | "Incorrect password" | ❌ |

## Docker Examples

### Basic Docker Deployment

```bash
docker run -it --name code-server -p 127.0.0.1:8080:8080 \
  -v "$PWD:/home/coder/project" \
  -v "$PWD/custom-strings.json:/custom-strings.json" \
  codercom/code-server:latest --custom-strings /custom-strings.json
```

### Corporate Branding with Inline JSON

```bash
docker run -it --name code-server -p 127.0.0.1:8080:8080 \
  -v "$PWD:/home/coder/project" \
  codercom/code-server:latest --custom-strings '{
    "WELCOME": "Welcome to ACME Corporation Development Portal",
    "LOGIN_TITLE": "ACME Dev Portal Access",
    "LOGIN_BELOW": "Enter your corporate credentials",
    "PASSWORD_PLACEHOLDER": "Corporate Password",
    "SUBMIT": "SIGN IN",
    "LOGIN_USING_ENV_PASSWORD": "Password managed by IT department"
  }'
```

## Using App Name with Custom Strings

The `--app-name` flag works perfectly with `--custom-strings` to provide the `{{app}}` placeholder functionality:

```bash
code-server \
  --app-name "Dev Portal" \
  --custom-strings '{"WELCOME": "Welcome to {{app}} environment"}'
```

This approach allows you to:
- Set a custom app name once with `--app-name`
- Use `{{app}}` placeholders in your custom strings
- Easily change the app name without updating all strings

### Examples with App Name

**Corporate branding with dynamic app name:**
```bash
code-server \
  --app-name "ACME Development Platform" \
  --custom-strings '{
    "WELCOME": "Welcome to {{app}}",
    "LOGIN_TITLE": "{{app}} Access Portal",
    "LOGIN_BELOW": "Please authenticate to access {{app}}"
  }'
```

**Internationalization with app name:**
```bash
code-server \
  --app-name "Mon Portail" \
  --custom-strings '{
    "WELCOME": "Bienvenue sur {{app}}",
    "LOGIN_TITLE": "Connexion à {{app}}",
    "SUBMIT": "SE CONNECTER"
  }'
```

## Legacy Flag Migration

The `--welcome-text` flag is deprecated. Migrate to `--custom-strings`:

**Old:**
```bash
code-server --welcome-text "Welcome to development"
```

**New:**
```bash
code-server --custom-strings '{"WELCOME": "Welcome to development"}'
```

## Benefits of Custom Strings

- ✅ **Scalable**: Add any new UI strings without new CLI flags
- ✅ **Flexible**: Supports both files and inline JSON
- ✅ **Future-proof**: Automatically supports new UI strings as they're added
- ✅ **Organized**: All customizations in one place
- ✅ **Version-controlled**: JSON files can be tracked in your repository

## Advanced Usage

### Multi-language Support

Create different JSON files for different languages:

```bash
# English
code-server --custom-strings /config/strings-en.json

# Spanish  
code-server --custom-strings /config/strings-es.json --locale es
```

### Dynamic Customization

Generate JSON dynamically in scripts:

```bash
#!/bin/bash
COMPANY_NAME="ACME Corp"
cat > /tmp/strings.json << EOF
{
  "WELCOME": "Welcome to ${COMPANY_NAME} Development Portal",
  "LOGIN_TITLE": "${COMPANY_NAME} Access Portal"
}
EOF

code-server --custom-strings /tmp/strings.json
```