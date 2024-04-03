import { createPool } from "mysql2/promise";

export const pool = createPool({
  host: "localhost",
  user: "root",
  password: "ullmusic",
  port: 3306,
  database: "login_node",
});
