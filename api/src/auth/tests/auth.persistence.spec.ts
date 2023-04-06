import { Collection } from 'mongodb';
import { MongoService } from '../../common/services/mongo.service';
import { TestContext, init } from '../../common/test-environment';
import { AuthPersistenceService } from '../auth.persistence';
import { AuthUser } from '../types/auth-user.entity';


describe('AuthPersistenceService', () => {
  let authPersistenceService: AuthPersistenceService;
  let collection: Collection<AuthUser>;

  beforeAll(async () => {
    const context: TestContext = await init();
    authPersistenceService = context.t.get<AuthPersistenceService>(
      AuthPersistenceService,
    );
    const mongoService = context.t.get<MongoService>(MongoService);
    collection = mongoService.getCollection(AuthUser.name)
  });

  afterEach(async () => {
    await collection.deleteMany({});
  })


  it('createUser - should create a user and return it', async () => {
    // Arrange
    const email = 'test@test.com';
    const password = 'password';
    const salt = 'salt';

    // Act
    const user = await authPersistenceService.createUser(email, password, salt);

    // Assert
    expect(user.email).toBe(email);
    expect(user.password).toBe(password);
    expect(user.salt).toBe(salt);
    expect(user._id).toBeDefined();
  });

  it('getUserFromEmail - should find a user by email and password', async () => {
    // Arrange
    const email = 'test@test.com';
    const password = 'password';
    const salt = 'salt';
    const createdUser = await authPersistenceService.createUser(email, password, salt);

    // Act
    const foundUser = await authPersistenceService.getUserFromEmail(
      email,
    );

    // Assert
    expect(foundUser.email).toEqual(email);
    expect(foundUser.password).toEqual(password);
    expect(foundUser.salt).toEqual(salt);
    expect(foundUser._id).toEqual(createdUser._id);
  });

  it('getUserFromEmail - should not find a user with invalid credentials', async () => {
    // Arrange
    const email = 'test@test.com';
    const password = 'password';
    const salt = 'salt';
    await authPersistenceService.createUser(email, password, salt);

    // Act
    const user = await authPersistenceService.getUserFromEmail(
      'wrong email',
    );

    // Assert
    expect(user).toBeNull();
  });

});