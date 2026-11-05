using Microsoft.IdentityModel.Tokens;

// Пази публичните ключове на Supabase, с които се проверява подписът на токените.
public class SupabaseKeys(string jwksUrl)
{
    private static readonly HttpClient Http = new();
    private readonly object _lock = new();
    private JsonWebKeySet? _set;
    private DateTime _loadedAt;

    public IEnumerable<SecurityKey> Get(string? kid)
    {
        lock (_lock)
        {
            var age = DateTime.UtcNow - _loadedAt;
            var isStale = _set is null || age > TimeSpan.FromHours(1);
            // Токен с непознат ключ (ротация): презареждаме, но най-много веднъж в минута
            var isUnknownKey = _set is not null && kid is not null
                && !_set.Keys.Any(k => k.Kid == kid) && age > TimeSpan.FromMinutes(1);

            if (isStale || isUnknownKey)
            {
                _set = new JsonWebKeySet(Http.GetStringAsync(jwksUrl).GetAwaiter().GetResult());
                _loadedAt = DateTime.UtcNow;
            }
            return _set!.GetSigningKeys();
        }
    }
}