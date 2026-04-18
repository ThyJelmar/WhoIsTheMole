namespace WhoIsTheMole.Application.DTOs;

public record UpdateSeasonRequest(
    string Name,
    int Year,
    bool IsActive
);
