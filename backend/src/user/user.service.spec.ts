import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schema/user.schema';

describe('UserService', () => {
  let service: UserService;
  let userModel: any;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@example.com',
    role: 'participant',
  };

  const mockUserWithPassword = {
    ...mockUser,
    password: 'hashed',
  };

  // Helper: creates a chainable mock that returns value on .select()
  const withSelect = (value: unknown) => ({
    select: jest.fn().mockResolvedValue(value),
  });

  beforeEach(async () => {
    userModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue(withSelect([mockUser])),
      findById: jest.fn().mockReturnValue(withSelect(mockUser)),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn().mockReturnValue(withSelect(mockUser)),
      findByIdAndDelete: jest.fn().mockReturnValue(withSelect(mockUser)),
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
    it('should create a user', async () => {
      const createDto = { username: 'newuser', email: 'new@example.com' };
      userModel.create.mockResolvedValue({ ...mockUserWithPassword, ...createDto });

      const result = await service.create(createDto as any);

      expect(userModel.create).toHaveBeenCalledWith(createDto);
      expect(result).toHaveProperty('email', createDto.email);
    });
  });

  describe('findAll', () => {
    it('should return all users without password', async () => {
      const result = await service.findAll();

      expect(userModel.find).toHaveBeenCalled();
      expect(userModel.find().select).toHaveBeenCalledWith('-password');
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id without password', async () => {
      const result = await service.findOne(mockUser._id);

      expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(userModel.findById(mockUser._id).select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userModel.findById.mockReturnValue(withSelect(null));

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email (with password for auth)', async () => {
      userModel.findOne.mockResolvedValue(mockUserWithPassword);

      const result = await service.findByEmail(mockUser.email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(result).toEqual(mockUserWithPassword);
    });

    it('should return null if email not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nope@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user and return without password', async () => {
      const updateDto = { username: 'updated' };
      const updatedUser = { ...mockUser, ...updateDto };
      userModel.findByIdAndUpdate.mockReturnValue(withSelect(updatedUser));

      const result = await service.update(mockUser._id, updateDto as any);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user and return without password', async () => {
      const result = await service.remove(mockUser._id);

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });
  });
});
