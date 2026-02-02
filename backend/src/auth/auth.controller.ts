import { Body, Controller, Get, Post, Request } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService
    ) { }

    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        try {
            return await this.authService.register(registerDto);
        } catch (error) {
            throw new Error(`error: ${error}`);
        }
    }

    @Get('me')
    async getCurrentUser(@Request() req: any) {
        return await this.authService.getCurrentUser(req.user);
    }
}