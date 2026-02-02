import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UserModule } from "src/user/user.module";

@Module({
    imports: [
        UserModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || "dev_secret",
            signOptions: { expiresIn: "1d" },
        }),
    ],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}