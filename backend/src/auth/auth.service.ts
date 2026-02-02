import { HttpException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "src/user/user.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) { }

    private async createToken(user: { _id?: unknown; id?: unknown; email?: string; username?: string }) {
        const subject = (user?._id ?? user?.id) as { toString?: () => string } | undefined;
        const payload = {
            sub: subject?.toString ? subject.toString() : subject,
            email: user?.email,
            username: user?.username,
        };

        return this.jwtService.signAsync(payload);
    }

    async register(registerDTO: RegisterDto) {
        const { password, confirmPassword, ...rest } = registerDTO;
        const user = await this.userService.findByEmail(registerDTO.email);
        const userExists = Array.isArray(user) ? user.length > 0 : Boolean(user);

        if (userExists) throw new HttpException("email already exist", 409);
        if (password !== confirmPassword) throw new HttpException("password and confirm password not matched", 400);

        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = {
            ...rest,
            password: hashedPassword,
        };

        const createdUser = await this.userService.create(newUser);
        const accessToken = await this.createToken(createdUser as { _id?: unknown; id?: unknown; email?: string; username?: string });

        return { user: createdUser, accessToken };
    }

    async login() {

    }
}