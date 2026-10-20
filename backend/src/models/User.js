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
            // Accounts created with "Sign in with Google" have no password until the user sets one
            required() {
                return this.hasPassword;
            },
            select: false,
        },
        // false for Google-only accounts. Existing accounts (field missing) read as true.
        hasPassword: { type: Boolean, default: true },
        // Google's stable account id ("sub" in the ID token), set when the user signs in with Google
        googleId: { type: String, unique: true, sparse: true, select: false },
        // Set when the password changes; tokens issued before this moment stop working (see middleware/auth.js)
        passwordChangedAt: { type: Date, default: null },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        toJSON: {
            transform(_doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                delete ret.passwordHash;
                delete ret.passwordChangedAt;
                delete ret.googleId;
                return ret;
            },
        },
    }
);

export default mongoose.model("User", userSchema);
