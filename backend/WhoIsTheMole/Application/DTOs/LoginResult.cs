namespace WhoIsTheMole.Application.DTOs;

public record LoginResult(
    Guid   UserId,
    string Name,
    string Email,
    string Role,
    string AccessToken,
    string RawRefreshToken
);
