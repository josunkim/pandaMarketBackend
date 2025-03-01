import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../../prismaClient";

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET;
const serverState = (req: Request, res: Response) => {
  try {
    const state = "activate";
    return res.status(200).json(state); // 사용자 목록을 JSON 형식으로 응답
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error });
  }
};
// 사용자 목록 가져오기
/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:  [Users]
 *     summary: 사용자 목록 조회
 *     description: 모든 사용자의 목록을 가져옵니다.
 *     responses:
 *       200:
 *         description: 성공적으로 사용자 목록을 가져옴
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 사용자 ID
 *                   email:
 *                     type: string
 *                     description: 이메일
 *                   name:
 *                     type: string
 *                     description: 사용자 이름
 *       500:
 *         description: 서버 오류
 */
const getuserList = async (req: Request, res: Response) => {
  try {
    const users = await prisma.users.findMany({
      where: {
        deletedAt: null, // 소프트 삭제된 데이터 제외
      },
    });
    return res.status(200).json(users); // 사용자 목록을 JSON 형식으로 응답
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error });
  }
};

// 사용자 등록
/**
 * @swagger
 * /api/users/create:
 *   post:
 *     tags: [Users]
 *     summary: 사용자 등록
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 이메일
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *               name:
 *                 type: string
 *                 description: 이름
 *               nickname:
 *                 type: string
 *                 description: 닉네임
 *     responses:
 *       201:
 *         description: 사용자 등록 성공
 *       500:
 *         description: 서버 오류
 */

const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, nickname } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        nickname,
      },
    });
    return res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "서버 오류" });
  }
};

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags: [Users]
 *     summary: 사용자 로그인
 *     description: 이메일과 비밀번호로 로그인하고, 유효한 토큰을 반환합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 사용자의 이메일
 *               password:
 *                 type: string
 *                 description: 사용자의 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공 및 토큰 발급
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Access Token (1시간 유효)
 *                 refreshToken:
 *                   type: string
 *                   description: Refresh Token (7일 유효)
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 사용자 ID
 *                     email:
 *                       type: string
 *                       description: 사용자 이메일
 *                     name:
 *                       type: string
 *                       description: 사용자 이름
 *                     nickname:
 *                       type: string
 *                       description: 사용자 닉네임
 *       400:
 *         description: 잘못된 이메일 또는 비밀번호
 *       500:
 *         description: 서버 오류
 */

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.users.findUnique({
      where: { email },
    });

    let passwordIsValid = false;
    if (user.password.includes("$2b$")) {
      passwordIsValid = await bcrypt.compare(password, user.password);
    } else {
      passwordIsValid = user.password === password;
    }

    // Access Token 생성
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      SECRET_KEY,
      {
        expiresIn: "1h", // 1시간 유효
      }
    );

    // Refresh Token 생성
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      SECRET_KEY,
      {
        expiresIn: "1d", // 7일 유효
      }
    );

    return res.status(200).json({ accessToken, refreshToken, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "서버 오류" });
  }
};

/**
 * @swagger
 * /api/users/verify/{token}:
 *   get:
 *     tags: [Authentication]
 *     summary: 토큰 유효성 검사
 *     description: 주어진 토큰을 검증하여 유효한지 확인합니다.
 *     parameters:
 *       - name: token
 *         in: path
 *         description: 인증 토큰
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 토큰이 유효함
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "토큰이 유효합니다."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 사용자 ID
 *                       example: "user-id"
 *                     email:
 *                       type: string
 *                       description: 사용자 이메일
 *                       example: "user@example.com"
 *       401:
 *         description: 유효하지 않은 토큰 또는 토큰 미제공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "유효하지 않은 토큰입니다."
 */

const verifyToken = (req: Request, res: Response) => {
  const { token } = req.params;
  console.log(token);
  if (!token) {
    return res.status(401).json({ error: "토큰이 제공되지 않았습니다." });
  }

  jwt.verify(token, SECRET_KEY as string, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
    }

    return res
      .status(200)
      .json({ message: "토큰이 유효합니다.", user: decoded });
  });
};

/**
 * @swagger
 * /api/users/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh Token을 이용해 새로운 Access Token 발급
 *     description: 기존의 Refresh Token을 사용하여 새로운 Access Token을 발급합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh Token
 *     responses:
 *       200:
 *         description: 새로운 Access Token 발급 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: 새로운 Access Token
 *       401:
 *         description: 유효하지 않은 Refresh Token
 *       500:
 *         description: 서버 오류
 */
const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ error: "Refresh Token이 제공되지 않았습니다." });
    }

    // Refresh Token 검증
    jwt.verify(refreshToken, SECRET_KEY as string, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ error: "유효하지 않은 Refresh Token입니다." });
      }

      // Refresh Token이 유효한 경우, 새로운 Access Token 발급
      const newAccessToken = jwt.sign(
        { id: decoded.id, email: decoded.email },
        SECRET_KEY as string,
        {
          expiresIn: "1h", // 새로운 Access Token 유효 기간 설정
        }
      );

      // 새로운 Access Token 반환
      return res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "서버 오류" });
  }
};

// 사용자 프로필 조회
/**
 * @swagger
 * /api/users/profile/{id}:
 *   get:
 *     tags: [Users]
 *     summary: 사용자 프로필 조회
 *     description: ID를 기반으로 사용자 정보를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 사용자 정보 반환
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
    }

    return res.status(200).json(user); // 사용자 프로필 정보 응답
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "서버 오류" });
  }
};

// 사용자 프로필 수정
/**
 * @swagger
 * /api/users/profile/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: 사용자 프로필 수정
 *     description: 사용자 정보를 수정합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               nickname:
 *                 type: string
 *     responses:
 *       200:
 *         description: 사용자 정보 수정 성공
 *       500:
 *         description: 서버 오류
 */
const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, name, nickname } = req.body;

    const updatedUser = await prisma.users.update({
      where: { id },
      data: {
        email,
        password,
        nickname,
      },
    });

    return res.status(200).json(updatedUser); // 업데이트된 사용자 프로필 응답
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "서버 오류" });
  }
};

// 사용자 삭제
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: 사용자 삭제
 *     description: ID를 기반으로 사용자를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 사용자 삭제 성공
 *       500:
 *         description: 서버 오류
 */
const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedUser = await prisma.users.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({ message: "사용자 삭제 성공" }); // 사용자 삭제 성공 메시지
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "서버 오류" });
  }
};

const service = {
  serverState,
  getuserList,
  createUser,
  login,
  getUser,
  updateUser,
  deleteUser,
  verifyToken,
  refreshToken,
};

export default service;
