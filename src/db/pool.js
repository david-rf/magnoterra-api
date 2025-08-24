import mysql from 'mysql2/promise';
import logger from '../lib/logger.js';

class DatabasePool {
  constructor() {
    this.pool = null;
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  async createPool() {
    try {
      this.pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test connection
      await this.pool.getConnection();
      logger.info('Database pool created successfully');
      this.retryCount = 0;
      return this.pool;
    } catch (error) {
      logger.error('Failed to create database pool:', error.message);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
        logger.info(`Retrying in ${delay}ms... (Attempt ${this.retryCount}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.createPool();
      }
      
      throw new Error(`Failed to create database pool after ${this.maxRetries} attempts`);
    }
  }

  async getPool() {
    if (!this.pool) {
      await this.createPool();
    }
    return this.pool;
  }

  async query(sql, params = []) {
    const pool = await this.getPool();
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      logger.error('Database query error:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database pool closed');
    }
  }
}

const dbPool = new DatabasePool();

export default dbPool;
