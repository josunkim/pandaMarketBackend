import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import path from "path";

const isProd = process.env.NODE_ENV === "production"; // 환경 변수 확인
const SERVER_URL = isProd
  ? process.env.PROD_SERVER_URL || "https://default-prod-url.com"
  : process.env.DEV_SERVER_URL || "http://localhost:5000";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "판다마켓 API 문서",
      version: "1.0.0",
      description: "API 문서",
    },
    servers: [
      {
        url: SERVER_URL,
        description: isProd ? "배포 서버" : "개발 서버",
      },
    ],
    tags: [
      {
        name: "Users",
        description: "사용자 관련 API",
      },
    ],
  },
  apis: [path.join(process.cwd(), "src/routes/**/*.ts")],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
