"""
Async SQLAlchemy engine + session factory for SQLite.
"""
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DEBUG,
    # SQLite: enforce FK constraints per connection
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a transactional DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def _migrate_protocol_entries(conn) -> None:
    """Remove the unique constraint from protocol_entries.incident_id.
    Required so that one incident can produce multiple protocol entries (split decisions)."""
    try:
        result = await conn.execute(
            text("SELECT sql FROM sqlite_master WHERE type='table' AND name='protocol_entries'")
        )
        row = result.fetchone()
        if not row or not row[0]:
            return  # table does not exist yet; create_all will create it correctly

        table_sql: str = row[0]
        # Detect inline UNIQUE on incident_id column or a separate UNIQUE constraint
        has_unique = (
            "UNIQUE" in table_sql.upper()
            and "incident_id" in table_sql.lower()
        )
        if not has_unique:
            return  # already migrated

        logger.info("Migrating protocol_entries: removing UNIQUE on incident_id …")
        await conn.execute(text("DROP TABLE IF EXISTS _protocol_entries_new"))
        await conn.execute(text("""
            CREATE TABLE _protocol_entries_new (
                id         INTEGER NOT NULL,
                incident_id INTEGER NOT NULL,
                race_id    INTEGER NOT NULL,
                sequence_number INTEGER NOT NULL,
                pilot_numbers   VARCHAR(100) NOT NULL,
                violation_type  VARCHAR(50)  NOT NULL,
                transcript_raw  TEXT,
                decision_type   VARCHAR(50)  NOT NULL,
                penalty_detail  VARCHAR(200),
                post_label      VARCHAR(50)  NOT NULL,
                marshal_name    VARCHAR(100) NOT NULL,
                judge_name      VARCHAR(100) NOT NULL,
                created_at      DATETIME DEFAULT (CURRENT_TIMESTAMP),
                PRIMARY KEY (id),
                FOREIGN KEY(incident_id) REFERENCES incidents (id) ON DELETE CASCADE,
                FOREIGN KEY(race_id) REFERENCES races (id)
            )
        """))
        await conn.execute(text("INSERT INTO _protocol_entries_new SELECT * FROM protocol_entries"))
        await conn.execute(text("DROP TABLE protocol_entries"))
        await conn.execute(text("ALTER TABLE _protocol_entries_new RENAME TO protocol_entries"))
        logger.info("Migration complete.")
    except Exception as exc:
        logger.warning("Protocol entries migration failed (will be applied next restart): %s", exc)


async def init_db() -> None:
    """Create all tables (idempotent; for dev/test use Alembic in production)."""
    # Import models so Base.metadata knows about them
    from app.models import race, user, incident, audio  # noqa: F401

    async with engine.begin() as conn:
        await _migrate_protocol_entries(conn)
        await conn.run_sync(Base.metadata.create_all)
