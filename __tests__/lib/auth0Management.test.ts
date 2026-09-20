import { deleteAuth0User, isAuth0ManagementConfigured } from "../../lib/auth0Management";

const fetchMock = jest.fn();
const ENV = { ...process.env };

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  process.env = {
    ...ENV,
    AUTH0_ISSUER_BASE_URL: "https://tenant.eu.auth0.com/",
    AUTH0_MGMT_CLIENT_ID: "mgmt-id",
    AUTH0_MGMT_CLIENT_SECRET: "mgmt-secret",
  };
});

afterAll(() => {
  process.env = ENV;
});

describe("isAuth0ManagementConfigured", () => {
  it("needs the issuer and both M2M credentials", () => {
    expect(isAuth0ManagementConfigured()).toBe(true);
    delete process.env.AUTH0_MGMT_CLIENT_SECRET;
    expect(isAuth0ManagementConfigured()).toBe(false);
  });
});

describe("deleteAuth0User", () => {
  it("fetches a client-credentials token and deletes the user with it", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "tok" }) })
      .mockResolvedValueOnce({ ok: true, status: 204 });

    await deleteAuth0User("auth0|abc");

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe("https://tenant.eu.auth0.com/oauth/token");
    expect(JSON.parse(tokenInit.body)).toMatchObject({
      grant_type: "client_credentials",
      client_id: "mgmt-id",
      audience: "https://tenant.eu.auth0.com/api/v2/",
    });
    const [deleteUrl, deleteInit] = fetchMock.mock.calls[1];
    expect(deleteUrl).toBe("https://tenant.eu.auth0.com/api/v2/users/auth0%7Cabc");
    expect(deleteInit).toMatchObject({
      method: "DELETE",
      headers: { Authorization: "Bearer tok" },
    });
  });

  it("treats an already-missing user as deleted", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "tok" }) })
      .mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(deleteAuth0User("auth0|gone")).resolves.toBeUndefined();
  });

  it("throws when the token or the deletion fails", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(deleteAuth0User("auth0|abc")).rejects.toThrow("status 401");

    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: "tok" }) })
      .mockResolvedValueOnce({ ok: false, status: 403 });
    await expect(deleteAuth0User("auth0|abc")).rejects.toThrow("status 403");
  });
});
