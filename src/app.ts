import express from "express";
import cors from "cors";
import userRoutes from "./routes/user/controller";
import { setupSwagger } from "./swagger";

const app = express();

setupSwagger(app);
app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행중입니다`);
});

export default app;
