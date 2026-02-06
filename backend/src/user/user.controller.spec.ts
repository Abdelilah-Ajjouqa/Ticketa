import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<Partial<UserService>>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    role: 'participant',
  };

  beforeEach(async () => {
    userService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = { username: 'newuser', email: 'new@example.com' };
      userService.create.mockResolvedValue(mockUser as any);

      const result = await controller.create(dto as any);

      expect(userService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      userService.findAll.mockResolvedValue([mockUser] as any);

      const result = await controller.findAll();

      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('getProfile', () => {
    it('should return the user from request', () => {
      const req = { user: { userId: mockUser._id, role: 'participant' } };

      const result = controller.getProfile(req);

      expect(result).toEqual(req.user);
    });
  });

  describe('getAdminData', () => {
    it('should return protected admin data', () => {
      const result = controller.getAdminData();

      expect(result).toEqual({ message: 'This is protected admin data' });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userService.findOne.mockResolvedValue(mockUser as any);

      const result = await controller.findOne(mockUser._id);

      expect(userService.findOne).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const dto = { username: 'updated' };
      const updated = { ...mockUser, ...dto };
      userService.update.mockResolvedValue(updated as any);

      const result = await controller.update(mockUser._id, dto as any);

      expect(userService.update).toHaveBeenCalledWith(mockUser._id, dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      userService.remove.mockResolvedValue(mockUser as any);

      const result = await controller.remove(mockUser._id);

      expect(userService.remove).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });
  });
});
