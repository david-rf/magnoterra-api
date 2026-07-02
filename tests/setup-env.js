process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '0';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'mysql://test:test@localhost:3306/test';
