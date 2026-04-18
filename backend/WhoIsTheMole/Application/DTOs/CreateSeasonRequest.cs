namespace WhoIsTheMole.Application.DTOs;

public record CreateSeasonRequest(
    string Name,
    int Year,
    bool IsActive = false
);
