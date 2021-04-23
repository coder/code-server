# Configuring OpenID authentication

The purpose of this guide is to demonstrate the process of configuring an OpenID application as an authentication and authorization source for Code-Server.

More information regarding how OpenID Connect works can be found here:

- <https://openid.net/connect/faq/>
- <https://auth0.com/docs/protocols/openid-connect-protocol>
- <https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc>

## Prerequisites

- Either Keycloak has been deployed or an existing Auth0/Okta account exists.
  - Auth0 Signup: https://auth0.com/signup
  - Okta Signup: https://developer.okta.com/signup/
  - Getting started with Keycloak: https://www.keycloak.org/docs/latest/getting_started/
- A value needs to be generated for `openid-secret`. This value will be used to encrypt the OpenID Connect session token.
  - MacOS/Linux: `openssl rand -base64 25`
  - Windows: <https://activedirectoryfaq.com/2017/08/creating-individual-random-passwords/>

## Auth0 OpenID Connect application setup

### Creating the application

1. Navigate to the application management section of your Auth0 dashboard at `https://manage.auth0.com/dashboard/us/{{auth0_account_name}}/applications`
2. Click the **Create Application** button in the top right of the page.
3. Either provide a name for this application or use the default, then select **Regular Web Application** as the application type and click the blue **Create** button.
   <kbd>
   <img src="assets/openid-connect/auth0/create-application.png" />
   </kbd>

### Gather the client ID

1. Make note of the `Client ID` value. This value will be used in the code-server `openid-client-id` configuration variable.
   <kbd>
   <img src="assets/openid-connect/auth0/application-client-id.png" />
   </kbd>

### Update the application URLs

1. Update the **_Allowed Callback URL_** and **_Allowed Logout URLs_** fields so that they point to the correct code-server endpoint.
   <kbd>
   <img src="assets/openid-connect/auth0/update-application.png" />
   </kbd>

### Example Auth0 code-server configuration

---

**NOTE:** The `openid-issuer-base-url` should be set to the value of the **Domain** field of the Okta application.

---

```yml
bind-addr: 127.0.0.1:8080
cert: false

auth: openid
openid-issuer-base-url: "https://cdr.auth0.com"
openid-client-id: "yg3IIz2alcikRqjqOsnRJABn8Uthfrtv"
openid-base-url: "http://localhost:8080"
openid-secret: "{prerequisites_openid-secret_value}"
```

## Okta OpenID Connect application setup

### Creating the application

1. Navigate to the **Add Application** page of your Okta dashboard at `https://{{okta_account_name}}-admin.okta.com/admin/apps/add-app`
2. Click the **Create New App** button located in the upper right of the page.
3. Set the **Platform** to **Web** and **Sign on method** to **OpenID Connect**. Then click **Create**
   <kbd>
   <img src="assets/openid-connect/okta/create-application.png" />
   </kbd>

### Update the application

1. Update the **Application name** field with the desired name for this application.
2. Update the **Login redirect URIs** and **Logout redirect URIs (Optional)** fields so that they point to the correct code-server endpoint then click **Save**
   <kbd><img src="assets/openid-connect/okta/update-application.png"/></kbd>
3. To update the **Allowed grant types** start by navigating to the **General Settings** section and clicking the **Edit** link in the top right corner of the section card.
4. Once in the edit view, locate the **Allowed grant types** checkbox list and make sure the boxes for **Implicit (Hybrid)** and **Allow ID Token with implicit grant type** are checked, then scroll to the bottom of the page and click **Save**.
   <kbd><img src="assets/openid-connect/okta/update-application-grants.png"/></kbd>
5. Lastly, ensure a user is assigned to this application by navigating to the **Assignments** tab, clicking on **Assign**, then selecting **Assign to People**.
   <kbd><img src="assets/openid-connect/okta/update-application-assignments.png"/></kbd>

### Gather the client ID

1. Make note of the `Client ID` value. This value will be used in the code-server `openid-client-id` configuration variable.
   <kbd>
   <img src="assets/openid-connect/okta/application-client-id.png" />
   </kbd>

### Example code-server configuration

---

**NOTE:** The `openid-issuer-base-url` should be set to the value of the **Okta domain** field of the Okta application.

---

```yml
bind-addr: 127.0.0.1:8080
cert: false

auth: openid
openid-issuer-base-url: "https://cdr.okta.com"
openid-client-id: "0oal8azjyekLwJXan5d6"
openid-base-url: "http://localhost:8080"
openid-secret: "{prerequisites_openid-secret_value}"
```

## Keycloak OpenID Connect client setup

### Creating the client

1. Once logged into the Keycloak instance, navigate to the **Clients** page by clicking the **Clients** link in the navigation menu on the left side of the page.
2. Begin the client creation process by clicking the **Create** button located in the top right corner of the client list.
3. Fill out the client creation fields then click **Save** - Client ID**: This is the value that will later be populated in `openid-client-id`. This value is entirely up the the user or process creating the client. - **Client Protocol**: This value should be set to **openid-connect** - **Root URL**: This field should be populated with the code-server base URL.
   <kbd>
   <img src="assets/openid-connect/keycloak/create-client.png" />
   </kbd>

### Update the client name

1. Once the **Save** button in the **Add Client** window has been clicked, the client will be created and the page will be redirected to the client settings view. From inside that view proceed to name the newly create client by populating the **Name** field.
2. Enable implicit flow by changing **Implicit Flow Enabled** from **OFF** to **ON**.
3. Scroll to the bottom of the page and click **Save**.
   <kbd>
   <img src="assets/openid-connect/keycloak/update-client.png" />
   </kbd>

### Example code-server configuration

---

**NOTE:** The `openid-issuer-base-url` will depend on the Keycloak realm. In the example below the realm is called `master`.

**NOTE:** The `openid-client-id` value should be set to the value given to the **Client ID** when the client was first created.

---

```yml
bind-addr: 127.0.0.1:8080
cert: false

auth: openid
openid-issuer-base-url: "https://keycloak.local/auth/realms/master/.well-known/openid-configuration"
openid-client-id: "example-code-server"
openid-base-url: "http://localhost:8080"
openid-secret: "{prerequisites_openid-secret_value}"
```
