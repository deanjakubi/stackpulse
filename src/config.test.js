"use strict";

const { loadConfig } = require("./config");

describe("loadConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when GITHUB_TOKEN is missing", () => {
    delete process.env.GITHUB_TOKEN;
    expect(() => loadConfig()).toThrow("GITHUB_TOKEN");
  });

  it("returns config with defaults when only token is set", () => {
    process.env.GITHUB_TOKEN = "ghp_test123";
    delete process.env.STACKPULSE_REPOS;
    delete process.env.STACKPULSE_MAX_AGE_DAYS;

    const config = loadConfig();
    expect(config.token).toBe("ghp_test123");
    expect(config.repos).toEqual([]);
    expect(config.maxAgeDays).toBe(30);
    expect(config.baseUrl).toBe("https://api.github.com");
  });

  it("parses STACKPULSE_REPOS correctly", () => {
    process.env.GITHUB_TOKEN = "ghp_test123";
    process.env.STACKPULSE_REPOS = "owner/repo1, owner/repo2 , owner/repo3";

    const config = loadConfig();
    expect(config.repos).toEqual(["owner/repo1", "owner/repo2", "owner/repo3"]);
  });

  it("parses STACKPULSE_MAX_AGE_DAYS correctly", () => {
    process.env.GITHUB_TOKEN = "ghp_test123";
    process.env.STACKPULSE_MAX_AGE_DAYS = "7";

    const config = loadConfig();
    expect(config.maxAgeDays).toBe(7);
  });

  it("throws when STACKPULSE_MAX_AGE_DAYS is invalid", () => {
    process.env.GITHUB_TOKEN = "ghp_test123";
    process.env.STACKPULSE_MAX_AGE_DAYS = "abc";

    expect(() => loadConfig()).toThrow("STACKPULSE_MAX_AGE_DAYS");
  });
});
