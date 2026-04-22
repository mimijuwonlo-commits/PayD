import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { JWTPayload } from '../types/auth.js';
import { apiErrorResponse, ErrorCodes } from '../utils/apiError.js';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res
        .status(401)
        .json(apiErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
      req.user = decoded;
      next();
    } catch (error) {
      return res
        .status(403)
        .json(apiErrorResponse(ErrorCodes.FORBIDDEN, 'Invalid or expired token'));
    }
  } else {
    res.status(401).json(apiErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authorization header missing'));
  }
};

export default authenticateJWT;
