import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
        },
        // Only the bcrypt hash is stored — never the plain password.
        // `select: false` means it is not returned by queries unless asked for explicitly.
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: {
            transform(_doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                delete ret.passwordHash;
                return ret;
            },
        },
    }
);

export default mongoose.model("User", userSchema);
