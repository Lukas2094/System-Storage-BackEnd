// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Importe o ConfigModule e ConfigService
import { BlacklistService } from './blacklist.service'; // Importe o BlacklistService

@Module({
    imports: [
        TypeOrmModule.forFeature([Users]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule], // Importe o ConfigModule
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'), // Use o ConfigService para acessar a chave secreta
                signOptions: { expiresIn: '1h' },
            }),
            inject: [ConfigService], // Injete o ConfigService
        }),
        ConfigModule.forRoot(), // Certifique-se de que o ConfigModule está sendo importado
    ],
    providers: [AuthService, JwtStrategy, BlacklistService], // Adicione o BlacklistService
    controllers: [AuthController],
    exports: [JwtStrategy, PassportModule],
})
export class AuthModule { }