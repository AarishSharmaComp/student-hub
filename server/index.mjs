import { createApp } from "./api.mjs";
const production = process.env.NODE_ENV === "production";
const demo = process.env.DEMO_MODE === "true";
if (production && demo)
  throw new Error("DEMO_MODE must be disabled in production.");
if (production && !process.env.APP_ORIGIN?.startsWith("https://"))
  throw new Error("Set APP_ORIGIN to the public HTTPS origin.");
const { server, db } = createApp({
  databasePath: process.env.DATABASE_PATH || "./data/student-hub.sqlite",
  demo,
  production,
  origin: process.env.APP_ORIGIN || "http://localhost:8080",
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,
});
server.listen(Number(process.env.PORT || 3001), "127.0.0.1", () =>
  console.log(
    `Student Hub API listening on http://127.0.0.1:${process.env.PORT || 3001}`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
