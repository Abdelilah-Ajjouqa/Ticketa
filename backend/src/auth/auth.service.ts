import { HttpException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/user.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) { }

    private async createToken(user: any) {
        const payload = {
            sub: String(user._id || user.id),
            email: user.email,
            username: user.username,
            role: user.role,
        };

        return this.jwtService.signAsync(payload);
    }

    async register(registerDTO: RegisterDto) {
        const { password, confirmPassword, ...rest } = registerDTO;
        const user = await this.userService.findByEmail(registerDTO.email);;

        if (user) throw new HttpException("email already exist", 409);
        if (password !== confirmPassword) throw new HttpException("password and confirm password not matched", 400);

        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = {
            ...rest,
            password: hashedPassword,
        };

        const createdUser = await this.userService.create(newUser);
        const accessToken = await this.createToken(createdUser);

        return { user: createdUser, accessToken };
    }

    async login(loginDto: LoginDto) {
        const user = await this.userService.findByEmail(loginDto.email);
        if (!user) throw new HttpException("Invalid credentials", 401);

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) throw new HttpException("Invalid credentials", 401);

        const accessToken = await this.createToken(user);

        return { user, accessToken };
    }

    async getCurrentUser(user: any) {
        if (!user) throw new HttpException("Unauthorized", 401);

        const userData = await this.userService.findOne(user.userId);

        if (!userData) throw new HttpException("User not found", 404);

        return userData;
    }
}