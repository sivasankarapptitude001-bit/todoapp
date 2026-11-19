import { Sequelize } from "sequelize";
import { environment } from "./environment";

const options = {
  dialect: "postgres" as const,
  logging: environment.NODE_ENV === "development" ? console.log : false
};

export const sequelize = environment.DATABASE_URL
  ? new Sequelize(environment.DATABASE_URL, options)
  : new Sequelize(
      environment.DB_NAME,
      environment.DB_USER,
      environment.DB_PASSWORD,
      {
        ...options,
        host: environment.DB_HOST,
        port: environment.DB_PORT
      }
    );
