import fs from 'fs/promises';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { ParsedQs } from 'qs';

import { User } from '../models/userModel';
import { IUser, IUserDocument, IUserGoogle } from '../interfaces/userInterface';
import { Environment } from '../utils/env';
import { BadRequestError, NotFoundError, InvalidCredentials } from '../utils/errors';
import MailService from './mailService';
import logger from '../utils/logger';

export class UserService {
  public async registerUser(userDetails: IUser, userFoto?: string): Promise<void> {
    const { email, password, name, surname, birthday, phoneNumber, address } = userDetails;

    const lowercaseEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: lowercaseEmail });

    if (existingUser) {
      throw new BadRequestError('Email already exists');
    }

    const user: IUser = new User({
      email: lowercaseEmail,
      password,
      name,
      surname,
      birthday,
      phoneNumber,
      address,
      picture: userFoto || '',
    });

    await user.save();
  }

  public async authenticateUser(userDetails: IUser): Promise<IUser> {
    const { email, password } = userDetails;

    const lowercaseEmail = email.toLowerCase();

    const user: IUser | null = await User.findOne({ email: lowercaseEmail });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      throw new InvalidCredentials('Invalid credentials');
    }

    return user;
  }

  public async refreshAccessToken(refreshToken: string) {
    const decoded: any = jwt.verify(refreshToken, Environment.jwtSecretRefresh);
    const { id, email } = decoded;
    if (!decoded || !id) {
      throw new Error('Invalid refresh token');
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  public async getAllUsers(queryParams: ParsedQs): Promise<IUser[]> {
    const { sort, range, filter } = queryParams;

    const sortArray = sort ? JSON.parse(sort as string) : [];
    const rangeArray = range ? JSON.parse(range as string) : [];
    const filterObject = filter ? JSON.parse(filter as string) : {};

    const users = await User.find(filterObject)
      .sort(sortArray.length ? { [sortArray[0]]: sortArray[1] === 'DESC' ? -1 : 1 } : {})
      .skip(rangeArray.length ? rangeArray[0] : 0)
      .limit(rangeArray.length ? rangeArray[1] - rangeArray[0] + 1 : 0);

    return users;
  }

  public async getUsersById(userId: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }
    const user: IUser | null = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.picture) {
      const picture = await fs.readFile(user.picture, { encoding: 'base64' });

      user.picture = 'data:image/*;base64,' + picture;
    }

    return user;
  }

  public async updateUser(userId: string, userDetails: IUser, userFoto: string): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }

    const user: IUserDocument | null = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const oldPicturePath = user.picture;

    Object.entries(userDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        user[key] = value;
      }
    });

    user.picture = userFoto;

    const updatedUser = await user.save();

    if (oldPicturePath) {
      try {
        await fs.unlink(oldPicturePath);
      } catch (error) {
        logger.info(`Picture not found: ${error}`);
      }
    }
    return updatedUser;
  }

  public async deleteUser(userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }
    const deletedUser: IUser | null = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      throw new NotFoundError('User not found');
    }
  }

  public async resetPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const resetToken = uuidv4();

    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;

    await user.save();

    const resetLink = `${Environment.resetLink}/${resetToken}`;
    const emailContent = `Click the following link to reset your password: ${resetLink}`;

    const mailerService = MailService.getInstance();

    await mailerService.sendMail(email, {
      subject: 'Password Reset',
      text: emailContent,
      to: email,
      html: '',
    });
  }

  public async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ resetToken, resetTokenExpiry: { $gt: Date.now() } });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    user.password = newPassword;

    await user.save();
  }

  public async checkUserPassword(userInfo: any, currentPassword: string): Promise<boolean> {
    const email = userInfo.email;
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new BadRequestError('User not found');
    }

    return await bcrypt.compare(currentPassword, user.password);
  }

  public async changeUserPassword(userInfo: any, newPassword: string): Promise<void> {
    const email = userInfo.email;
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    user.password = newPassword;
    await user.save();
  }

  public async editInfo(userInfo: any, editData: IUser, userFoto: string): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(userInfo.id)) {
      throw new BadRequestError('Invalid user ID');
    }

    const user: IUserDocument | null = await User.findOne({ email: userInfo.email });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const oldPicturePath = user.picture;

    Object.entries(editData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        user[key] = value;
      }
    });

    user.picture = userFoto;

    const updatedUser = await user.save();

    if (oldPicturePath) {
      await fs.unlink(oldPicturePath);
    }

    if (updatedUser.picture) {
      const picture = await fs.readFile(updatedUser.picture, { encoding: 'base64' });
      updatedUser.picture = 'data:image/*;base64,' + picture;
    }

    return updatedUser;
  }

  public async googleLogin(userInfo: any): Promise<IUserGoogle> {
    const {
      profile: { _json },
    } = userInfo;

    const lowercaseEmail = _json.email.toLowerCase();

    const userData: IUser | null = await User.findOne({ email: lowercaseEmail });

    if (userData) {
      let { email, name, surname, birthday, phoneNumber, address, picture } = userData;
      const user: IUserGoogle = new User({
        email: lowercaseEmail || email,
        name: { arm: _json.given_name } || name,
        surname: { arm: _json.family_name } || surname,
        birthday: _json.birthday || birthday,
        phoneNumber: phoneNumber,
        address: address,
        picture: _json.picture || picture,
      });
      return user;
    } else {
      const user: IUserGoogle = new User({
        email: lowercaseEmail,
        name: { arm: _json.given_name },
        surname: { arm: _json.family_name },
        birthday: _json.birthday,
        phoneNumber: '',
        address: { arm: '' },
        picture: _json.picture,
      });
      await user.save();
      return user;
    }
  }

  public async facebookLogin(userInfo: any): Promise<IUserGoogle> {
    const {
      profile: { _json },
    } = userInfo;

    const lowercaseEmail = _json.email.toLowerCase();

    const userData: IUser | null = await User.findOne({ email: lowercaseEmail });

    if (userData) {
      let { email, name, surname, birthday, phoneNumber, address, picture } = userData;
      const user: IUserGoogle = new User({
        email: lowercaseEmail || email,
        name: { arm: _json.first_name } || name,
        surname: { arm: _json.last_name } || surname,
        birthday: _json.birthday || birthday,
        phoneNumber: phoneNumber,
        address: address,
        picture: _json.picture || picture,
      });
      return user;
    } else {
      const user: IUserGoogle = new User({
        email: lowercaseEmail,
        name: { arm: _json.first_name },
        surname: { arm: _json.last_name },
        birthday: _json.birthday || '',
        phoneNumber: '',
        address: { arm: '' },
        picture: _json.picture || '',
      });
      await user.save();
      return user;
    }
  }
}
