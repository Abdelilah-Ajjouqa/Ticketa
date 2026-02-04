import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { UserRole } from "src/common/enums/user-role.enum";

export type UserDocment = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    @Prop()
    username: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({
        required: true,
        enum: UserRole,
        default: UserRole.PARTICIPANT
    })
    role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);