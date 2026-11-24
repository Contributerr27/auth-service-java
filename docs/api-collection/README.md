# API collection (Bruno)

A [Bruno](https://www.usebruno.com/) collection for the auth-service-java API. It covers signup, login, refresh, logout and `GET /auth/me`. Request and response shapes are in [`../API_CONTRACT.md`](../API_CONTRACT.md). The collection is plain text files, so it also diffs well in review.

## Use it

1. Start the service (see the README quick start). It listens on `http://localhost:8080` by default.
2. In Bruno choose **Open Collection** and select this folder (`docs/api-collection`).
3. Pick the **local** environment in the top right.
4. Run the requests in order: **Signup**, **Login**, **Refresh**, **Get current user**, **Logout**. Or run the whole collection with the runner.

Each request has a test. Run the collection from the CLI with `bru run --env local` (install with `npm i -g @usebruno/cli`) from this folder.

## How the requests chain

- **Signup** creates a user with a fresh generated email (`bruno-<timestamp>@example.com`) and saves `accessToken` and `refreshToken` as collection variables.
- **Login** and **Refresh** overwrite those variables with the new pair.
- **Get current user** sends `Authorization: Bearer {{accessToken}}`.
- **Logout** revokes the saved refresh token.

## Change the base URL

Edit `baseUrl` in `environments/local.bru`, or add another environment file, for example `environments/staging.bru`:

```
vars {
  baseUrl: https://auth.example.test
  password: choose-a-demo-password
}
```

## Notes

- Signup and login are rate limited to 10 requests per 10 minutes per client IP. After that the service returns 429 with a `Retry-After` header.
- The `password` in `local.bru` is a throwaway demo value for a local database. Do not commit real credentials or tokens. Tokens live only in Bruno's runtime variables and are never written to these files.
