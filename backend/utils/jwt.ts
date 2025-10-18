import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret-key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'fleet-management-system',
      audience: 'fleet-management-users'
    }
  );
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key',
      {
        issuer: 'fleet-management-system',
        audience: 'fleet-management-users'
      }
    ) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};
