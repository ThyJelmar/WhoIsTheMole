using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhoIsTheMole.Application.DTOs;
using WhoIsTheMole.Application.Services;

namespace WhoIsTheMole.API.Controllers;

[ApiController]
[Authorize]
public class CandidatesController(ICandidateService candidateService, IWebHostEnvironment env) : ControllerBase
{
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxPhotoSize = 2 * 1024 * 1024; // 2 MB

    // GET /api/seasons/{seasonId}/candidates
    [HttpGet("api/seasons/{seasonId:guid}/candidates")]
    public async Task<IActionResult> GetBySeason(Guid seasonId)
        => Ok(await candidateService.GetBySeasonAsync(seasonId));

    // POST /api/seasons/{seasonId}/candidates
    [HttpPost("api/seasons/{seasonId:guid}/candidates")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create(Guid seasonId, [FromBody] CreateCandidateRequest request)
    {
        var candidate = await candidateService.CreateAsync(seasonId, request);
        return CreatedAtAction(nameof(GetById), new { id = candidate.Id }, candidate);
    }

    // GET /api/candidates/{id}
    [HttpGet("api/candidates/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var candidate = await candidateService.GetByIdAsync(id);
        return candidate is null
            ? NotFound(new { message = "Candidate not found." })
            : Ok(candidate);
    }

    // PUT /api/candidates/{id}
    [HttpPut("api/candidates/{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCandidateRequest request)
    {
        var candidate = await candidateService.UpdateAsync(id, request);
        return Ok(candidate);
    }

    // DELETE /api/candidates/{id}
    [HttpDelete("api/candidates/{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await candidateService.DeleteAsync(id);
        return NoContent();
    }

    // POST /api/candidates/{id}/photo
    [HttpPost("api/candidates/{id:guid}/photo")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> UploadPhoto(Guid id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        if (file.Length > MaxPhotoSize)
            return BadRequest(new { message = "File size must not exceed 2 MB." });

        if (!AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = "Only JPEG, PNG, and WebP images are allowed." });

        var uploadsDir = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using (var stream = System.IO.File.Create(filePath))
            await file.CopyToAsync(stream);

        var photoUrl  = $"/uploads/{fileName}";
        var candidate = await candidateService.UpdatePhotoAsync(id, photoUrl);
        return Ok(new { photoUrl = candidate.PhotoUrl });
    }
}
