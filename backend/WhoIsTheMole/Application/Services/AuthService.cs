using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using WhoIsTheMole.Application.DTOs;
using WhoIsTheMole.Application.Exceptions;
using WhoIsTheMole.Domain.Entities;
using WhoIsTheMole.Domain.Entities.Enums;
using WhoIsTheMole.Infrastructure.Data;

namespace WhoIsTheMole.Application.Services;

public class AuthService(AppDbContext db, IConfiguration config) : IAuthService
{
    // ── Registration ──────────────────────────────────────────────────────

    public async Task RegisterAsync(RegisterRequest request)
    {
        if (request.Password.Length < 8)
            throw new BadRequestException("Password must be at least 8 characters.");

        if (await db.Users.AnyAsync(u => u.Email == request.Email))
            throw new BadRequestException("An account with this email already exists.");

        var user = new User
        {
            Id           = Guid.NewGuid(),
            Email        = request.Email.ToLowerInvariant().Trim(),
            Name         = request.Name.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role         = UserRole.User,
            IsActive     = true,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
    }

    // ── Login ─────────────────────────────────────────────────────────────

    public async Task<LoginResult> LoginAsync(LoginRequest request)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant().Trim() && u.IsActive)
            ?? throw new UnauthorizedException("Invalid email or password.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        return await IssueTokensAsync(user);
    }

    // ── Refresh ───────────────────────────────────────────────────────────

    public async Task<LoginResult> RefreshAsync(string rawRefreshToken)
    {
        var tokenHash = HashToken(rawRefreshToken);

        var stored = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == tokenHash)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        if (stored.IsRevoked)
            throw new UnauthorizedException("Refresh token has been revoked.");

        if (stored.IsExpired)
            throw new UnauthorizedException("Refresh token has expired.");

        // Rotate: revoke old, issue new
        stored.RevokedAt = DateTime.UtcNow;
        var result = await IssueTokensAsync(stored.User);
        await db.SaveChangesAsync();

        return result;
    }

    // ── Logout ────────────────────────────────────────────────────────────

    public async Task LogoutAsync(string rawRefreshToken)
    {
        var tokenHash = HashToken(rawRefreshToken);

        var stored = await db.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == tokenHash && t.RevokedAt == null);

        if (stored is not null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private async Task<LoginResult> IssueTokensAsync(User user)
    {
        var accessToken = GenerateJwt(user);

        var rawRefreshToken = GenerateRawToken();
        var refreshDays = int.TryParse(config["Jwt:RefreshTokenExpiryDays"], out var d) ? d : 7;
        var refreshToken = new RefreshToken
        {
            Id        = Guid.NewGuid(),
            UserId    = user.Id,
            Token     = HashToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
        };

        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        return new LoginResult(user.Id, user.Name, user.Email, user.Role.ToString(),
                               accessToken, rawRefreshToken);
    }

    private string GenerateJwt(User user)
    {
        var secret  = config["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret not configured.");
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiryMins = int.TryParse(config["Jwt:AccessTokenExpiryMinutes"], out var m) ? m : 15;
        var expires = DateTime.UtcNow.AddMinutes(expiryMins);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name,               user.Name),
            new Claim(ClaimTypes.Role,               user.Role.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:            config["Jwt:Issuer"],
            audience:          config["Jwt:Audience"],
            claims:            claims,
            expires:           expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRawToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
