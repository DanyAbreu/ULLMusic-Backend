import express from "express";
import morgan from "morgan";

import indexRoutes from "./routes/indexRoutes.js";

const app = express();

// settings
app.set("port", process.env.PORT || 4000);

//middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

//Routes
app.use(indexRoutes);

// starting the server
export default app;