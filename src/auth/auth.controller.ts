import { Controller, Post, Body, Put, UseGuards, Param, Req, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { BlacklistService } from './blacklist.service';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private blacklistService: BlacklistService) { }

    @Post('register')
    async register(@Body() body: any) {
        const { name, email, password } = body;
        return this.authService.register(name, email, password);
    }

    @Post('login')
    async login(@Body() body: any) {
        const { email, password } = body;
        const { accessToken } = await this.authService.login(email, password);
        return { accessToken };
    }

    @UseGuards(AuthGuard('jwt')) 
    @Post('logout')
    async logout(@Req() request: any) {
        const token = request.headers.authorization.split(' ')[1];
        this.blacklistService.addToBlacklist(token);
        return { message: 'Logout realizado com sucesso' };
    }

    @Put('update-password/:userId')
    @UseGuards(JwtAuthGuard)
    async updatePassword(
        @Param('userId') userId: number,
        @Body() body: { currentPassword: string; newPassword: string },
    ): Promise<void> {
        const { currentPassword, newPassword } = body;
        return this.authService.updatePassword(userId, currentPassword, newPassword);
    }

    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        const result = await this.authService.forgotPassword(email);
        if (!result) {
            throw new NotFoundException('E-mail não encontrado');
        }
        return { message: 'E-mail de redefinição enviado!' };
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; newPassword: string }) {
        const { token, newPassword } = body;
        return this.authService.resetPassword(token, newPassword);
    }
}