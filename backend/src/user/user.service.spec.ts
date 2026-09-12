import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User } from './schema/user.schema';
import { UserRole } from '../common/enums/user-role.enum';

describe('UserService', () => {
  let service: UserService;
  let userModel: {
    create: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
    findOne: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
  };

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'john_doe',
    email: 'john@example.com',
    role: UserRole.PARTICIPANT,
  };

  beforeEach(async () => {
    userModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const createDto = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        role: UserRole.PARTICIPANT,
      };
      userModel.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto as any);

      expect(userModel.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const mockQuery = { select: jest.fn().mockResolvedValue([mockUser]) };
      userModel.find.mockReturnValue(mockQuery);

      const result = await service.findAll();

      expect(userModel.find).toHaveBeenCalled();
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should find user by id without password', async () => {
      const mockQuery = { select: jest.fn().mockResolvedValue(mockUser) };
      userModel.findById.mockReturnValue(mockQuery);

      const result = await service.findOne(mockUser._id);

      expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      userModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update and return user without password', async () => {
      const updateDto = { username: 'john_updated' };
      const updatedUser = { ...mockUser, username: 'john_updated' };
      const mockQuery = { select: jest.fn().mockResolvedValue(updatedUser) };
      userModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const result = await service.update(mockUser._id, updateDto);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        updateDto,
        { new: true },
      );
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete and return the deleted user', async () => {
      const mockQuery = { select: jest.fn().mockResolvedValue(mockUser) };
      userModel.findByIdAndDelete.mockReturnValue(mockQuery);

      const result = await service.remove(mockUser._id);

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id);
      expect(mockQuery.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUser);
    });
  });
});
