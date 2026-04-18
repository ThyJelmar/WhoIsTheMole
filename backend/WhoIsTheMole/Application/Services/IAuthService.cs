using WhoIsTheMole.Application.DTOs;

namespace WhoIsTheMole.Application.Services;

public interface IAuthService
{
    Task RegisterAsync(RegisterRequest request);
    Task<LoginResult> LoginAsync(LoginRequest request);
    Task<LoginResult> RefreshAsync(string rawRefreshToken);
    Task LogoutAsync(string rawRefreshToken);
}
