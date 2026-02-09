import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'src/common/enums/user-role.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(configService);
  });

  describe('validate', () => {
    it('should return user payload from JWT token', () => {
      const payload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.PARTICIPANT,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
      });
    });
  });
});
