import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';

let mongoServer;

export const generateTestToken = (userId = 'mockUser123') => {
  return jwt.sign({ id: userId, role: 'auditor' }, process.env.JWT_SECRET || 'supersecret_test_key', { expiresIn: '1h' });
};

beforeAll(async () => {
  // Keep tests isolated from external cache/real DB dependencies.
  process.env.JWT_SECRET = 'supersecret_test_key';
  process.env.NODE_ENV = 'test';
  
  // Ephemeral Memory DB Spin Up
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
  }
  await mongoose.connect(uri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
  }
  if (mongoServer) {
      await mongoServer.stop();
  }
});

afterEach(async () => {
  // Wipe cleanly natively stopping leaked states explicitly globally
  const collections = mongoose.connection.collections;
  for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
  }
  jest.clearAllMocks();
});
