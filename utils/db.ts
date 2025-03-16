import mongoose, { Connection } from 'mongoose';

import logger from '../utils/logger';
import { Environment } from './env';

export class DB {
  private dbURI: string = Environment.mongoUri;
  private dbConnection!: Connection;
  private dbMaxRetries: number = Number(Environment.dbMaxRetries);
  private dbBaseDelayMs: number = Number(Environment.dbMaxDelayMs);
  private dbMaxDelayMs: number = Number(Environment.dbMaxDelayMs);

  constructor() {
    this.connect();
  }

  private async connect(retryCount = 0) {
    try {
      await mongoose.connect(this.dbURI);
      logger.info('Connected to MongoDB');
      this.dbConnection = mongoose.connection;
      this.setupEventListeners();
    } catch (error) {
      logger.info(`Mongoose connection error: ${error}`);
      if (retryCount < this.dbMaxRetries) {
        const retryDelay = this.calculateRetryDelay(retryCount);
        logger.info(`Retrying connection in ${(retryDelay / 1000).toFixed(3)} seconds...`);
        setTimeout(() => this.connect(retryCount + 1), retryDelay);
      } else {
        logger.error('Max retry count reached. Unable to establish a connection.');
      }
    }
  }

  private calculateRetryDelay(retryCount: number) {
    const fibonacci = [0, 1];
    while (fibonacci.length <= retryCount) {
      const nextValue = fibonacci[fibonacci.length - 1] + fibonacci[fibonacci.length - 2];
      fibonacci.push(nextValue);
    }
    const delay = this.dbBaseDelayMs * fibonacci[retryCount];
    const randomJitter = Math.random() * this.dbBaseDelayMs;
    return Math.min(delay + randomJitter, this.dbMaxDelayMs);
  }

  private setupEventListeners() {
    this.dbConnection.on('connecting', () => {
      logger.info('Connecting to MongoDB...');
    });

    this.dbConnection.on('error', (err) => {
      logger.info(`Mongoose connection error: ${err}`);
    });

    this.dbConnection.on('connected', () => {
      logger.info('Connected to MongoDB');
    });

    this.dbConnection.once('open', () => {
      logger.info('MongoDB connection opened');
    });

    this.dbConnection.on('disconnecting', () => {
      logger.info('Mongoose connection disconnecting');
    });

    this.dbConnection.on('disconnected', () => {
      logger.info('Mongoose connection disconnected');
    });

    this.dbConnection.on('close', () => {
      logger.info('Mongoose connection closed');
    });

    this.dbConnection.on('reconnected', () => {
      logger.info(`MongoDB reconnected!`);
    });

    process.on('SIGINT', async () => {
      try {
        await this.dbConnection.close();
        logger.info('Mongoose  connection disconnected through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error while closing MongoDB connection:', err);
        process.exit(1);
      }
    });
  }

  public getConnection(): Connection {
    return this.dbConnection;
  }
}
