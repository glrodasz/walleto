import { auth0MgmtConfig, fetchAuth0Users } from "./auth0Users";

describe("auth0MgmtConfig", () => {
  it("is null until the machine-to-machine app is configured", () => {
    expect(auth0MgmtConfig({ AUTH0_ISSUER_BASE_URL: "https://t.auth0.com" })).toBeNull();
  });

  it("takes the issuer's host, or the explicit management domain", () => {
    const base = { AUTH0_MGMT_CLIENT_ID: "id", AUTH0_MGMT_CLIENT_SECRET: "secret" };
    expect(auth0MgmtConfig({ ...base, AUTH0_ISSUER_BASE_URL: "https://login.app.com/" })).toEqual({
      clientId: "id",
      clientSecret: "secret",
      domain: "login.app.com",
    });
    expect(
      auth0MgmtConfig({
        ...base,
        AUTH0_ISSUER_BASE_URL: "login.app.com",
        AUTH0_MGMT_DOMAIN: "tenant.eu.auth0.com",
      })?.domain
    ).toBe("tenant.eu.auth0.com");
  });
});

describe("fetchAuth0Users", () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const json = (body: unknown, ok = true) => ({
    ok,
    status: ok ? 200 : 403,
    json: async () => body,
  });

  it("gets a token, then maps each account", async () => {
    fetchMock.mockResolvedValueOnce(json({ access_token: "tok" })).mockResolvedValueOnce(
      json([
        {
          user_id: "auth0|a",
          email: "a@x.com",
          name: "a@x.com",
          created_at: "2026-10-01T00:00:00.000Z",
          last_login: "2026-10-20T00:00:00.000Z",
          logins_count: 7,
        },
      ])
    );

    const users = await fetchAuth0Users({
      clientId: "id",
      clientSecret: "s",
      domain: "t.auth0.com",
    });

    expect(fetchMock.mock.calls[0][0]).toBe("https://t.auth0.com/oauth/token");
    expect(fetchMock.mock.calls[1][0]).toContain("https://t.auth0.com/api/v2/users?page=0");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer tok");
    expect(users).toEqual([
      {
        id: "auth0|a",
        email: "a@x.com",
        name: null, // Auth0 fills `name` with the email; that's not a name.
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        lastLoginAt: new Date("2026-10-20T00:00:00.000Z"),
        logins: 7,
      },
    ]);
  });

  it("fails loudly when the API refuses", async () => {
    fetchMock.mockResolvedValueOnce(json({}, false));
    await expect(
      fetchAuth0Users({ clientId: "id", clientSecret: "s", domain: "t.auth0.com" })
    ).rejects.toThrow("Auth0 token request failed (403)");
  });
});
