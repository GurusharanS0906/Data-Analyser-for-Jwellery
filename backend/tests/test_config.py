from app.core.config import Settings


def test_cors_origins_parses_comma_separated_string():
    settings = Settings(CORS_ORIGINS="https://a.com, https://b.com")
    assert settings.CORS_ORIGINS == ["https://a.com", "https://b.com"]


def test_cors_origins_parses_single_origin():
    settings = Settings(CORS_ORIGINS="https://app.example.com")
    assert settings.CORS_ORIGINS == ["https://app.example.com"]


def test_cors_origins_still_accepts_json_list():
    settings = Settings(CORS_ORIGINS='["https://a.com","https://b.com"]')
    assert settings.CORS_ORIGINS == ["https://a.com", "https://b.com"]


def test_cors_origins_default_covers_dev_ports():
    settings = Settings()
    assert "http://localhost:3000" in settings.CORS_ORIGINS
    assert "http://localhost:3010" in settings.CORS_ORIGINS
