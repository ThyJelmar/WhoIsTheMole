namespace WhoIsTheMole.Application.DTOs;

public record UpdateCandidateRequest(
    string Name,
    string? Description
);
