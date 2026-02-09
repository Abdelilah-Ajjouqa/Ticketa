import { UserRole } from '../enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUser;
}
