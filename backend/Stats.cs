// Ред от серия, нужен за сметките
record SetRow(DateOnly Date, decimal Weight, int Reps);

static class Stats
{
    // Epley: тежест × (1 + повторения / 30). Трябва да съвпада със src/utils/stats.js
    public static decimal Epley1RM(decimal weight, int reps)
    {
        if (weight <= 0 || reps <= 0)
            return 0;
        if (reps == 1)
            return weight;
        return weight * (1 + reps / 30m);
    }

    public static decimal Round1(decimal value) =>
        Math.Round(value, 1, MidpointRounding.AwayFromZero);

    // Една точка за всеки ден: най-доброто от всички серии през този ден
    public static List<ProgressPointDto> BuildProgress(IEnumerable<SetRow> rows) =>
        rows.GroupBy(row => row.Date)
            .OrderBy(group => group.Key)
            .Select(group =>
            {
                var maxWeight = group.Max(row => row.Weight);

                return new ProgressPointDto(
                    group.Key,
                    Round1(group.Max(row => Epley1RM(row.Weight, row.Reps))),
                    maxWeight,
                    group.Where(row => row.Weight == maxWeight).Max(row => row.Reps),
                    group.Max(row => row.Reps)
                );
            })
            .ToList();
}
