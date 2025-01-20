import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./models/user.js";
import Product from "./models/product.js";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = 8000;

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("성공"))
  .catch((err) => console.log(err));

app.use(express.json(), cors());

app.post("/user/create", async (req, res) => {
  try {
    const { username, password, nickName } = req.body;

    const nameValidate = await User.findOne({ name: username });

    if (!username) {
      return res.status(400).send({ mssage: "username not found" });
    }
    if (!password) {
      return res.status(400).send({ mssage: "password not found" });
    }
    if (!nickName) {
      return res.status(400).send({ mssage: "nickName not found" });
    }
    if (nameValidate) {
      return res.status(400).send({ message: "username already in use" });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name: username,
      password: hashedPassword,
      nickName,
    });
    res.status(201).send(newUser);
  } catch (error) {
    res.status(400).send(error);
  }
});
app.get("/user/get/:id", async (req, res) => {
  const id = req.params.id;
  const userData = await User.findOne({ user_idx: id });
  res.send(userData);
});
/**
 *
 */
app.get("/product/getList", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // 현재 페이지
    const limit = parseInt(req.query.limit) || 10; // 페이지 당 항목 수

    const offset = (page - 1) * limit; // skip 계산

    // Product 모델에서 데이터 조회
    const products = await Product.find()
      .skip(offset) // 페이지에 맞는 오프셋 만큼 건너뜀
      .limit(limit) // 페이지 당 항목 수 제한
      .sort({ createdAt: -1 }); // 최신 순으로 정렬

    // 총 개수 조회
    const totalItems = await Product.countDocuments();

    // 전체 페이지 수 계산
    const totalPages = Math.ceil(totalItems / limit);

    // 응답 반환
    res.status(200).send({
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalItems,
      product: products,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.get("/product/get/:id", async (req, res) => {
  try {
    const { id } = req.params.id;

    if (!id) {
      res.status(400).send({ message: "not found id" });
    }

    const data = await Product.findById(id);
    const productData = {};
    if (!data) {
      res.status(404).send({ message: "Post not found" });
    }
    res.status(200).send(productData);
  } catch (error) {
    res.status.send(error);
  }
});

app.post("/product/create/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { title, description, price, image, tags } = req.body;
    if (!title || !description || !price) {
      return res.status(400).send({ message: "Missing required fields" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).send({ message: "Invalid userId" });
    }

    const newData = await Product.create({
      name: title,
      description,
      price,
      image: Array.isArray(image) ? image : [image],
      tags: Array.isArray(tags) ? tags : [tags],
      author: {
        name: user.name,
        nickName: user.nickName,
        idx: user.user_idx,
        id: user._id,
      },
    });

    res.status(201).send(newData);
  } catch (error) {
    res.status(400).send({ error });
  }
});
app.patch("/product/patch/:productionId", async (req, res) => {
  try {
    const productId = req.params.productionId;
    const { userId, title, description, price, image, tags } = req.body;
    if (!title || !description || !price) {
      return res.status(400).send({ message: "Missing required fields" });
    }
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).send({ message: "Invalid userId" });
    }
    const product = await Product.findByIdAndUpdate(
      productId,
      {
        name: title,
        description,
        price,
        image: Array.isArray(image) ? image : [image],
        tags: Array.isArray(tags) ? tags : [tags],
        author: {
          name: user.name,
          nickName: user.nickName,
          idx: user.user_idx,
          id: user._id,
        },
      },
      { new: true }
    );
    if (!product) {
      return res.status(400).send({ message: "제품을 찾을 수 없습니다" });
    }

    res.status(200).send(product);
  } catch (error) {
    res.status(400).send({ error });
  }
});

app.delete("/product/patch/:productionId", async (req, res) => {
  const productId = req.params.productionId;
  const { userId } = req.body;
  const user = await User.findById(userId);
  const protductCheck = await Product.findById(productId);
  if (!user) {
    return res.status(400).send({ message: "유저 정보가 정확하지 않음" });
  }
  if (!protductCheck) {
    return res.status(400).send({ message: "게시글이 존재 하지 않음" });
  }
  if (!protductCheck.author.id === user._id) {
    return res.status(400).send({ message: "작성자가 일치 하지 않습니다." });
  }

  const product = await Product.findByIdAndDelete(productId);
  product;
  res.status(200).send({ message: "삭제 성공" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
