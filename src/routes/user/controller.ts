import express from "express";
import service from "./service";

const router = express.Router();

// 사용자 관련 엔드포인트
router.get("/server", service.serverState); // 사용자 목록 가져오기
router.get("/", service.getuserList); // 사용자 목록 가져오기
router.get("/profile/:id", service.getUser); // 프로필 조회
router.get("/verify/:token", service.verifyToken); //token 유효성 검사
router.post("/login", service.login); // 로그인
router.post("/refresh", service.refreshToken); //token 갱신
router.post("/create", service.createUser); // 사용자 등록
router.patch("/profile/:id", service.updateUser); // 프로필 수정
router.delete("/:id", service.deleteUser); // 사용자 삭제

export default router;
