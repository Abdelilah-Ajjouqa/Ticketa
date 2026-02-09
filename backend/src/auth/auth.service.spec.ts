import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    findByEmail: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    username: 'testuser',
    password: '$2b$10$hashedpassword',
    role: 'participant',
  };

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'password123',
      confirmPassword: 'password123',
    };

    it('should register a new user and return user with access token (no password)', async () => {
      userService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const createdUser = {
        ...mockUser,
        email: registerDto.email,
        username: registerDto.username,
        toObject: function () {
          return { ...this };
        },
      };
      delete (createdUser as any).toObject;
      const createdUserWithToObject = {
        ...mockUser,
        email: registerDto.email,
        username: registerDto.username,
        toObject() {
          return {
            _id: this._id,
            email: this.email,
            username: this.username,
            password: this.password,
            role: this.role,
          };
        },
      };
      userService.create.mockResolvedValue(createdUserWithToObject as any);

      const result = await service.register(registerDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userService.create).toHaveBeenCalledWith({
        email: registerDto.email,
        username: registerDto.username,
        password: 'hashed-password',
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw 409 if email already exists', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        new HttpException('email already exist', 409),
      );
    });

    it('should throw 400 if passwords do not match', async () => {
      userService.findByEmail.mockResolvedValue(null);

      const dtoMismatch = { ...registerDto, confirmPassword: 'different' };

      await expect(service.register(dtoMismatch)).rejects.toThrow(
        new HttpException('password and confirm password not matched', 400),
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should login and return user with access token (no password)', async () => {
      const mockUserWithToObject = {
        ...mockUser,
        toObject() {
          return {
            _id: mockUser._id,
            email: mockUser.email,
            username: mockUser.username,
            password: mockUser.password,
            role: mockUser.role,
          };
        },
      };
      userService.findByEmail.mockResolvedValue(mockUserWithToObject as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw 401 if user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('Invalid credentials', 401),
      );
    });

    it('should throw 401 if password is invalid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('Invalid credentials', 401),
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user data with access token (no password)', async () => {
      const mockUserWithToObject = {
        ...mockUser,
        toObject() {
          return {
            _id: mockUser._id,
            email: mockUser.email,
            username: mockUser.username,
            password: mockUser.password,
            role: mockUser.role,
          };
        },
      };
      userService.findOne.mockResolvedValue(mockUserWithToObject as any);

      const result = await service.getCurrentUser({
        userId: mockUser._id,
        email: mockUser.email,
        username: mockUser.username,
        role: mockUser.role as any,
      });

      expect(userService.findOne).toHaveBeenCalledWith(mockUser._id);
      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toEqual({
        _id: mockUser._id,
        email: mockUser.email,
        username: mockUser.username,
        role: mockUser.role,
      });
    });

    it('should throw 401 if user payload is null', async () => {
      await expect(service.getCurrentUser(null)).rejects.toThrow(
        new HttpException('Unauthorized', 401),
      );
    });

    it('should throw 404 if user not found in database', async () => {
      userService.findOne.mockResolvedValue(null);

      await expect(
        service.getCurrentUser({
          userId: 'nonexistent',
          email: 'test@example.com',
          username: 'testuser',
          role: 'participant' as any,
        }),
      ).rejects.toThrow(new HttpException('User not found', 404));
    });
  });
});
