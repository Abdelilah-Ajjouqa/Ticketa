import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    username: 'testuser',
    role: 'participant',
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      getCurrentUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const registerDto = {
        email: 'new@example.com',
        username: 'newuser',
        password: 'pass123',
        confirmPassword: 'pass123',
      };
      const expected = { user: mockUser, accessToken: 'token' };
      authService.register.mockResolvedValue(expected as any);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const loginDto = { email: 'test@example.com', password: 'pass123' };
      const expected = { user: mockUser, accessToken: 'token' };
      authService.login.mockResolvedValue(expected as any);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expected);
    });
  });

  describe('getCurrentUser', () => {
    it('should call authService.getCurrentUser with req.user', async () => {
      const req = { user: { userId: mockUser._id, role: 'participant' } };
      authService.getCurrentUser.mockResolvedValue(mockUser as any);

      const result = await controller.getCurrentUser(req);

      expect(authService.getCurrentUser).toHaveBeenCalledWith(req.user);
      expect(result).toEqual(mockUser);
    });
  });
});
