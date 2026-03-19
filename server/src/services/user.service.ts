import { User } from "../models/user.model";
import { deleteFromCloudinary } from "./cloudinary.service";

export const currentUserService = async (userId: string) => {
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
        throw new Error("User not found.");
    }

    const payload = {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }

    return payload;
}

export const updateUserDetailsService = async (userId: string, updateData: { name?: string; username?: string }) => {
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
        throw new Error("User not found.");
    }

    if (updateData.username && updateData.username !== user.username) {
        const usernameExists = await User.findOne({ username: updateData.username });
        if (usernameExists) {
            throw new Error("Username already taken.");
        }
    }

    user.name = updateData.name || user.name;
    user.username = updateData.username || user.username;
    await user.save();

    const payload = {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }

    return payload;
}

export const updateUserAvatarService = async (userId: string, imageUrl: string, publicId: string) => {
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
        throw new Error("User not found.");
    }

    if (user.avatarPublicId) {
        await deleteFromCloudinary(user.avatarPublicId);
    }

    user.avatar = imageUrl;
    user.avatarPublicId = publicId;
    await user.save();

    const payload = {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };

    return payload;
}

export const deleteUserService = async (userId: string) => {
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
        throw new Error("User not found.");
    }

    if (user.avatarPublicId) {
        await deleteFromCloudinary(user.avatarPublicId);
    }

    user.isDeleted = true;
    user.email = `delete${user._id}@example.com`;
    user.username = `deleted_user_${user._id}`;
    await user.save();

    return;
}