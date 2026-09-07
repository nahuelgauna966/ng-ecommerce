import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  // Lo que devolvemos acá es exactamente lo que Passport deja en req.user.
  // El propio payload firmado ya nos alcanza (sub, email, role): no hace
  // falta ir a buscar el usuario a la DB en cada request.
  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
