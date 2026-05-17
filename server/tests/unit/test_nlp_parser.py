"""
Unit tests for the Russian NLP parser.
No external dependencies — runs instantly without Whisper or DB.
"""
import pytest
from app.services.nlp.parser import parse
from app.models.incident import ViolationType


def test_extracts_pilot_number_with_keyword():
    result = parse("пилот 7 нарушил правила трассы")
    assert 7 in result.pilot_numbers


def test_extracts_multiple_pilot_numbers():
    result = parse("столкновение между пилотом 7 и пилотом 23")
    assert set(result.pilot_numbers) == {7, 23}


def test_detects_collision():
    result = parse("столкновение на повороте три")
    assert result.violation_type == ViolationType.COLLISION


def test_detects_track_limits():
    result = parse("карт 12 пересечение трассы на секторе B")
    assert result.violation_type == ViolationType.TRACK_LIMITS


def test_detects_false_start():
    result = parse("фальстарт пилот 3")
    assert result.violation_type == ViolationType.FALSE_START
    assert 3 in result.pilot_numbers


def test_emergency_detection():
    result = parse("экстренная ситуация на трассе авария")
    assert result.is_emergency is True


def test_no_pilot_number_returns_empty():
    result = parse("всё в порядке")
    assert result.pilot_numbers == []
    assert result.violation_type is None


def test_free_text_residual():
    result = parse("пилот 5 нарушение на прямой")
    # pilot number and violation (if any) should be stripped
    assert "5" not in result.free_text or result.free_text != "пилот 5 нарушение на прямой"
