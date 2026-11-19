require("dotenv/config");

module.exports = {
  development: {
    username: process.env.DB_USER || "todo_user",
    password: process.env.DB_PASSWORD || "todo_password",
    database: process.env.DB_NAME || "todo_db",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres"
  },
  test: {
    username: process.env.DB_USER || "todo_user",
    password: process.env.DB_PASSWORD || "todo_password",
    database: process.env.DB_NAME || "todo_db",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres"
  },
  production: {
    ...(process.env.DATABASE_URL
      ? { use_env_variable: "DATABASE_URL" }
      : {
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT)
        }),
    dialect: "postgres"
  }
};
