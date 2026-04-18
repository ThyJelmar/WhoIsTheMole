using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhoIsTheMole.Application.DTOs;
using WhoIsTheMole.Application.Services;

namespace WhoIsTheMole.API.Controllers;

[ApiController]
[Route("api/seasons")]
[Authorize]
public class SeasonsController(ISeasonService seasonService) : ControllerBase
{
    // GET /api/seasons
    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await seasonService.GetAllAsync());

    // GET /api/seasons/active
    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var season = await seasonService.GetActiveAsync();
        return season is null ? NotFound(new { message = "No active season." }) : Ok(season);
    }

    // GET /api/seasons/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var season = await seasonService.GetByIdAsync(id);
        return season is null ? NotFound(new { message = "Season not found." }) : Ok(season);
    }

    // POST /api/seasons
    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Create([FromBody] CreateSeasonRequest request)
    {
        var season = await seasonService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = season.Id }, season);
    }

    // PUT /api/seasons/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSeasonRequest request)
    {
        var season = await seasonService.UpdateAsync(id, request);
        return Ok(season);
    }

    // DELETE /api/seasons/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await seasonService.DeleteAsync(id);
        return NoContent();
    }
}
