using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WhoIsTheMole.Application.Exceptions;
using WhoIsTheMole.Application.Services;
using WhoIsTheMole.Domain.Entities;
using WhoIsTheMole.Domain.Entities.Enums;
using WhoIsTheMole.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Services ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISeasonService, SeasonService>();
builder.Services.AddScoped<ICandidateService, CandidateService>();

// ── JWT Bearer (reads token from httpOnly cookie) ─────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer           = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidateAudience         = true,
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            ValidateLifetime         = true,
            ClockSkew                = TimeSpan.Zero,
        };

        // Read the JWT from the access_token cookie instead of the Authorization header
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                ctx.Token = ctx.Request.Cookies["access_token"];
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));   // required for httpOnly cookie exchange

// ── MVC ───────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ── Build ─────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Exception handling ────────────────────────────────────────────────────
app.UseExceptionHandler(errorApp => errorApp.Run(async ctx =>
{
    var feature   = ctx.Features.Get<IExceptionHandlerFeature>();
    var exception = feature?.Error;

    (int status, string message) = exception switch
    {
        BadRequestException e       => (StatusCodes.Status400BadRequest,    e.Message),
        UnauthorizedException e     => (StatusCodes.Status401Unauthorized,  e.Message),
        NotFoundException e         => (StatusCodes.Status404NotFound,      e.Message),
        InvalidOperationException e => (StatusCodes.Status400BadRequest,    e.Message),
        _                           => (StatusCodes.Status500InternalServerError, "An unexpected error occurred."),
    };

    ctx.Response.StatusCode  = status;
    ctx.Response.ContentType = "application/json";
    await ctx.Response.WriteAsJsonAsync(new { message });
}));

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();
app.UseStaticFiles();   // serves wwwroot/uploads/*
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await SeedDatabaseAsync(app);

app.Run();

// ── Seed ──────────────────────────────────────────────────────────────────
static async Task SeedDatabaseAsync(WebApplication app)
{
    using var scope  = app.Services.CreateScope();
    var db     = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    // Create schema (use EnsureCreated for SQLite dev; switch to MigrateAsync when migrations are added)
    await db.Database.EnsureCreatedAsync();

    var adminEmail = config["AdminSeed:Email"] ?? "admin@whoisthemole.local";
    if (!await db.Users.AnyAsync(u => u.Email == adminEmail))
    {
        var adminPassword = config["AdminSeed:Password"] ?? "ChangeMe123!";

        db.Users.Add(new User
        {
            Id           = Guid.NewGuid(),
            Email        = adminEmail,
            Name         = config["AdminSeed:Name"] ?? "Administrator",
            Role         = UserRole.Administrator,
            IsActive     = true,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
        });

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded initial admin account: {Email}", adminEmail);
    }
}
