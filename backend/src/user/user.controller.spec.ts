import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRole } from '../common/enums/user-role.enum';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'john_doe',
    email: 'john@example.com',
    role: UserRole.PARTICIPANT,
  };

  beforeEach(async () => {
    userService = {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      userService.findAll.mockResolvedValue([mockUser]);

      const result = await controller.findAll();

      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile from req.user', async () => {
      const req = {
        user: { userId: mockUser._id, role: UserRole.PARTICIPANT },
      } as any;
      userService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getProfile(req);

      expect(userService.findOne).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getAdminData', () => {
    it('should return protected admin message', () => {
      const result = controller.getAdminData();
      expect(result).toEqual({ message: 'This is protected admin data' });
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      userService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockUser._id);

      expect(userService.findOne).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update and return user', async () => {
      const updateDto = { username: 'john_updated' };
      const updated = { ...mockUser, username: 'john_updated' };
      userService.update.mockResolvedValue(updated);

      const result = await controller.update(mockUser._id, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser._id, updateDto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete and return user', async () => {
      userService.remove.mockResolvedValue(mockUser);

      const result = await controller.remove(mockUser._id);

      expect(userService.remove).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });
  });
});
