import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { User } from '../models/userModel';
import { Environment } from './env';
import { IUser } from '../interfaces/userInterface';

const ACCESS_TOKEN_TYPE: string = 'access';

export class PassportConfig {
  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.configureJwtStrategy();
    this.configureGoogleStrategy();
    this.configureFaceBookStrategy();
  }

  private configureJwtStrategy(): void {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Environment.jwtSecret,
    };

    passport.use(
      new JwtStrategy(options, async (payload, done) => {
        try {
          const user = await User.findOne({ email: payload.email });

          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }),
    );
  }

  private configureGoogleStrategy(): void {
    passport.use(
      new GoogleStrategy(
        {
          clientID: Environment.googleClientID,
          clientSecret: Environment.googleClientSecret,
          callbackURL: Environment.googleCallbackURL,
          scope: ['profile', 'email'],
        },
        async function (accessToken, refreshToken, profile: any, cb: any) {
          try {
            return cb(null, { profile });
          } catch (error) {
            return cb(error, null);
          }
        },
      ),
    );
    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser(function (user: any, done) {
      done(null, user);
    });
  }

  private configureFaceBookStrategy(): void {
    passport.use(
      new FacebookStrategy(
        {
          clientID: Environment.facebookClientID,
          clientSecret: Environment.facebookClientSecret,
          callbackURL: Environment.facebookCallbackURL,
          profileFields: ['id', 'displayName', 'email', 'first_name', 'middle_name', 'last_name', 'birthday'],
          scope: ['email', 'public_profile'],
        },
        async function (accessToken, refreshToken, profile: any, cb: any) {
          try {
            return cb(null, { profile });
          } catch (error) {
            return cb(error, null);
          }
        },
      ),
    );
    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser(function (user: IUser, done) {
      done(null, user);
    });
  }

  public authenticateJwt(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('jwt', { session: false })(req, res, next);
  }

  public authenticateGoogle(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }

  public generateToken(user: any, type: string): string {
    try {
      const expiresIn = type === ACCESS_TOKEN_TYPE ? Environment.EXPIRES_IN_ACCESS : Environment.EXPIRES_IN_REFRESH;
      const secretKey = type === ACCESS_TOKEN_TYPE ? Environment.jwtSecret : Environment.jwtSecretRefresh;

      return jwt.sign({ id: user._id, email: user.email }, secretKey, {
        expiresIn,
      });
    } catch (error) {
      console.error(`Error generating ${type} token:`, error);
      throw new Error(`Failed to generate ${type} token`);
    }
  }
}

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  };
};

const passportConfig = new PassportConfig();

export default passportConfig;
