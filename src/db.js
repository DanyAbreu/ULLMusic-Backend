import { createPool } from "mysql2/promise";

export const pool = createPool({
  host: "localhost",
  user: "root",
  password: "22032017",
  port: 3306,
  database: "ullmusic_back",
});
