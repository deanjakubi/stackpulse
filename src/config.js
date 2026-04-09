"use strict";

require("dotenv").config();

/**
 * Loads and validates configuration from environment variables.
 * @returns {object} Validated config object.
 */
function loadConfig() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "Missing required environment variable: GITHUB_TOKEN\n" +
        "Set it in your shell or create a .env file."
    );
  }

  const reposRaw = process.env.STACKPULSE_REPOS || "";
  const repos = reposRaw
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  const maxAge = parseInt(process.env.STACKPULSE_MAX_AGE_DAYS || "30", 10);
  if (isNaN(maxAge) || maxAge <= 0) {
    throw new Error(
      "STACKPULSE_MAX_AGE_DAYS must be a positive integer."
    );
  }

  return {
    token,
    repos,
    maxAgeDays: maxAge,
    baseUrl: process.env.GITHUB_API_URL || "https://api.github.com",
  };
}

module.exports = { loadConfig };
