import { app } from "./app";
import { environment } from "./config/environment";
import { sequelize } from "./config/database";

async function start(): Promise<void> {
  await sequelize.authenticate();
  app.listen(environment.PORT, () => {
    console.log(`Todo API listening on http://localhost:${environment.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start Todo API:", error);
  process.exit(1);
});
