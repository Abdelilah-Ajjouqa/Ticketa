import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

import { getModelToken } from '@nestjs/mongoose';
import { User } from './schema/user.schema';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: any = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
