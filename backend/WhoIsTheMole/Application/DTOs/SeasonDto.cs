namespace WhoIsTheMole.Application.DTOs;

public record SeasonDto(
    Guid Id,
    string Name,
    int Year,
    bool IsActive,
    int CandidateCount,
    int EpisodeCount
);
