import express from "express";
import path from "path";
import morgan from "morgan";

import indexRoutes from "./routes/indexRoutes.js";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// settings
app.set("port", process.env.PORT || 4000);
//app.set("views", path.join(__dirname, "views"));
//app.set("view engine", "ejs");

//middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

//Routes
app.use(indexRoutes);

//app.listen(port, ()=>{
//    console.log(`Server listening on http://localhost:${port}/`)
//});

// starting the server
export default app;