namespace WhoIsTheMole.Application.DTOs;

public record CandidateDto(
    Guid Id,
    Guid SeasonId,
    string Name,
    string? PhotoUrl,
    string? Description,
    bool IsActive
);
