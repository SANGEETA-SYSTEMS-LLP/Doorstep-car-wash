if (process.env.NODE_ENV === "production") {
  throw new Error(
    "The development test server cannot run when NODE_ENV is production."
  );
}

process.env.NODE_ENV ??= "development";
process.env.TEST_MODE = "true";

await import("./src/server.js");
