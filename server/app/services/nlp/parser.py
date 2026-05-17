"""
Rule-based Russian-language NLP parser for incident transcripts.

Extracts:
  - pilot_numbers: list[int]   — e.g. [7, 23]
  - violation_type: str | None — one of the ViolationType enum values
  - free_text: str             — remaining text after extraction

Design rationale:
  Rule-based approach chosen over ML NER to keep the system fully offline,
  deterministic, and easy for the race team to tune without ML expertise.
  Patterns cover standard Russian karting vocabulary; add synonyms as needed.
"""
import re
from dataclasses import dataclass, field

from app.models.incident import ViolationType

# ---------------------------------------------------------------------------
# Violation keyword map  (Russian terms → ViolationType)
# ---------------------------------------------------------------------------
_VIOLATION_PATTERNS: list[tuple[re.Pattern, ViolationType]] = [
    (re.compile(r"столкнов|таран|удар", re.IGNORECASE), ViolationType.COLLISION),
    (re.compile(r"пересечение трассы|выезд за пределы|срезал трассу", re.IGNORECASE), ViolationType.TRACK_LIMITS),
    (re.compile(r"фальстарт|фальш.старт", re.IGNORECASE), ViolationType.FALSE_START),
    (re.compile(r"опасн|агрессивн", re.IGNORECASE), ViolationType.UNSAFE_DRIVING),
    (re.compile(r"блокиров|заблокировал", re.IGNORECASE), ViolationType.BLOCKING),
]

# Match "пилот 7", "карт 23", "номер 7", bare "7" preceded by context
_PILOT_NUMBER_PATTERN = re.compile(
    r"(?:пилот|карт|гонщик|номер|№)\s*(\d{1,3})"
    r"|(?<!\d)(\d{1,3})(?!\d)",
    re.IGNORECASE,
)

# Emergency trigger words
_EMERGENCY_PATTERN = re.compile(r"экстренн|авария|ЧП|несчастный случай", re.IGNORECASE)


@dataclass
class ParseResult:
    pilot_numbers: list[int] = field(default_factory=list)
    violation_type: ViolationType | None = None
    free_text: str = ""
    is_emergency: bool = False


def parse(transcript: str) -> ParseResult:
    result = ParseResult()

    result.is_emergency = bool(_EMERGENCY_PATTERN.search(transcript))

    # --- Extract pilot numbers ---
    numbers_found: list[int] = []
    for match in _PILOT_NUMBER_PATTERN.finditer(transcript):
        num_str = match.group(1) or match.group(2)
        if num_str:
            numbers_found.append(int(num_str))
    # Deduplicate while preserving order
    seen: set[int] = set()
    for n in numbers_found:
        if n not in seen:
            result.pilot_numbers.append(n)
            seen.add(n)

    # --- Extract violation type (first match wins) ---
    for pattern, vtype in _VIOLATION_PATTERNS:
        if pattern.search(transcript):
            result.violation_type = vtype
            break

    # --- Free text: transcript with numbers and matched violation stripped ---
    free = transcript
    for match in reversed(list(_PILOT_NUMBER_PATTERN.finditer(transcript))):
        free = free[: match.start()] + free[match.end() :]
    if result.violation_type:
        for pattern, vtype in _VIOLATION_PATTERNS:
            if vtype == result.violation_type:
                free = pattern.sub("", free)
                break
    result.free_text = re.sub(r"\s{2,}", " ", free).strip()

    return result
