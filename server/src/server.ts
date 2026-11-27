import "dotenv/config";
import express from "express";
const app = express();
import morgan from "morgan";
import helmet from "helmet";
import notFound from "./middleware/notFound";
import errorHandlerMiddleware from "./middleware/errorHandler.middleware";
import authRouter from "./routes/auth.routes";
import customerRouter from "./routes/customer.routes";
import productRouter from "./routes/product.routes";
import salesRouter from "./routes/sale.routes";
import userRouter from "./routes/user.routes";
import cookieParser from "cookie-parser";
import YAML from "yamljs";
import swaggerUI from "swagger-ui-express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";

const __dirname = dirname(fileURLToPath(import.meta.url));

const swaggerDocument = YAML.load(path.join(__dirname, "docs", "swagger.yaml"));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());
app.use(helmet());
app.set("trust proxy", 1);
app.use(cookieParser(process.env.JWT_SECRET));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/customers", customerRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/sales", salesRouter);
app.use("/api/v1/users", userRouter);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use(notFound);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}...`);
    });
  } catch (error) {
    console.log("Failed to start server", error);
  }
};

start();
