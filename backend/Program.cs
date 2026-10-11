var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("Frontend");

var exercises = new List<Exercise>
{
    new(1, "Лежанка", "Гърди"),
    new(2, "Набиране", "Гръб"),
    new(3, "Клек", "Крака"),
    new(4, "Раменна преса", "Рамене"),
    new(5, "Бицепсово сгъване", "Ръце"),
    new(6, "Разтваряне с дъмбели", "Гърди"),
    new(7, "Гребане", "Гръб"),
    new(8, "Мъртва тяга", "Крака"),
    new(9, "Трицепсово разгъване", "Ръце"),
    new(10, "Лежанка на наклонена пейка", "Гърди"),
    new(11, "Кофички", "Гърди"),
    new(12, "Лицеви опори", "Гърди"),
    new(13, "Вертикална макара", "Гръб"),
    new(14, "Гребане с дъмбел", "Гръб"),
    new(15, "Шраг", "Гръб"),
    new(16, "Преса за крака", "Крака"),
    new(17, "Напади", "Крака"),
    new(18, "Румънска мъртва тяга", "Крака"),
    new(19, "Сгъване за задно бедро", "Крака"),
    new(20, "Повдигане встрани", "Рамене"),
    new(21, "Военна преса", "Рамене"),
    new(22, "Face pull", "Рамене"),
    new(23, "Задно рамо с дъмбели", "Рамене"),
    new(24, "Чук сгъване", "Ръце"),
    new(25, "Френска преса", "Ръце"),
    new(26, "Скот сгъване", "Ръце"),
};

app.MapGet("/api/exercises", () => exercises);

app.Run();

record Exercise(int Id, string Name, string MuscleGroup);
