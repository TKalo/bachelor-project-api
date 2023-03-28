import { Collection, MongoServerError } from 'mongodb';
import { MongoService } from '../../common/mongo.service';
import { init, TestContext } from '../../common/test-environment';
import { AuthService } from '../auth.service';
import { EmailTakenError } from '../errors/email-taken.error';
import { UserNotFoundError } from '../errors/user-not-found.error';
import { WrongPasswordError } from '../errors/wrong-password.error';
import { AuthUser } from '../types/auth-user.entity';


describe('AuthPersistenceService', () => {
  let authService: AuthService;
  let collection: Collection<AuthUser>;

  beforeAll(async () => {
    const context: TestContext = await init();
    authService = context.t.get<AuthService>(
      AuthService,
    );
    const mongoService = context.t.get<MongoService>(MongoService);
    collection = mongoService.getCollection(AuthUser.name)
  });

  
  afterEach(async () => {
    await collection.deleteMany({});
  })



  it('signup - when valid credentials given, should create a user and return authtokens', async () => {
    const email = 'test@example.com';
    const password = 'password';

    const tokens = await authService.signUp(email, password);

    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });

  it('signup - when in use email is given, should throw error', async () => {
    const email = 'test@example.com';
    const password = 'password';

    // Create a user with the same email first
   await authService.signUp(email, password);

    await expect(authService.signUp(email, password)).rejects.toThrowError(EmailTakenError);
  });

  it('signin - when non-exising credentials are used, should throw error', async () => {
    const email = 'test@example.com';
    const password = 'password';

    // Try to sign in with non-existing credentials
    await expect(authService.signIn(email, password)).rejects.toThrowError(UserNotFoundError);

  });


  it('signin - when wrong password is used, should throw error', async () => {
    const email = 'test@example.com';
    const password = 'password';

    // Create a user with the correct email and password
    await authService.signUp(email, password);

    // Try to sign in with wrong password
    await expect(authService.signIn(email, 'wrong-password')).rejects.toThrowError(WrongPasswordError);

  });

  
  it('signin - when user already in session should create new session', async () => {
    const email = 'test@example.com';
    const password = 'password';

    // Create a user with the correct email and password
    const tokens1 = await authService.signUp(email, password);

    // Sign in again with the same user to create a new session
    const tokens2 = await authService.signIn(email, password);

    // Ensure that the two sessions have the same refresh token
    expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);

  });
});