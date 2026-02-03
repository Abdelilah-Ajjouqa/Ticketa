import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private usermodel: Model<User>) { }

  async create(createUserDto: CreateUserDto) {
    return await this.usermodel.create(createUserDto);
  }

  async findAll() {
    return await this.usermodel.find();
  }

  async findOne(id: string) {
    return await this.usermodel.findById(id);
  }

  async findByEmail(email: string) {
    return await this.usermodel.findOne({ email: email });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return await this.usermodel.findByIdAndUpdate(id, updateUserDto);
  }

  async remove(id: string) {
    return await this.usermodel.findByIdAndDelete(id);
  }
}
