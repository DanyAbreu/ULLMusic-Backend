import { createPool } from "mysql2/promise";

export const pool = createPool({
  host: "localhost",
  user: "root",
  password: "INSERTAR-PASSWORD-MYSQL",
  port: 3306,
  database: "ullmusic_back",
});
