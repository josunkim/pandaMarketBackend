import mongoose from "mongoose";
import SequenceFactory from "mongoose-sequence";

const AutoIncrement = SequenceFactory(mongoose);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nickName: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
  },
  {
    timestamps: true,
  }
);
UserSchema.plugin(AutoIncrement, { inc_field: "user_idx" });
const User = mongoose.model("user", UserSchema);

export default User;
