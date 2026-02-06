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
    password: 'hashed',
    role: 'participant',
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
    it('should create a user', async () => {
      const createDto = { username: 'newuser', email: 'new@example.com' };
      userModel.create.mockResolvedValue({ ...mockUser, ...createDto });

      const result = await service.create(createDto as any);

      expect(userModel.create).toHaveBeenCalledWith(createDto);
      expect(result).toHaveProperty('email', createDto.email);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      userModel.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(userModel.find).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userModel.findById.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser._id);

      expect(userModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userModel.findById.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      userModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(userModel.findOne).toHaveBeenCalledWith({ email: mockUser.email });
      expect(result).toEqual(mockUser);
    });

    it('should return null if email not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nope@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto = { username: 'updated' };
      const updatedUser = { ...mockUser, ...updateDto };
      userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser._id, updateDto as any);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUser._id,
        updateDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      userModel.findByIdAndDelete.mockResolvedValue(mockUser);

      const result = await service.remove(mockUser._id);

      expect(userModel.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id);
      expect(result).toEqual(mockUser);
    });
  });
});
