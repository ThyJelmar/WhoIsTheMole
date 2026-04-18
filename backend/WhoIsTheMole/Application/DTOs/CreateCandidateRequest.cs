namespace WhoIsTheMole.Application.DTOs;

public record CreateCandidateRequest(
    string Name,
    string? Description
);
