import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

Base = declarative_base()

connect_args = {}
engine_kwargs = {"echo": False}

if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, **engine_kwargs)
    
    # Enable WAL mode and foreign keys for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    # MySQL / MariaDB / PostgreSQL configuration with connection pool
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 3600,
        "pool_pre_ping": True
    })
    engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import app.models.entities
    Base.metadata.create_all(bind=engine)
    
    # Create append-only tamper prevention trigger on audit_logs
    with engine.connect() as conn:
        if "sqlite" in settings.DATABASE_URL:
            try:
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_audit_prevent_update
                    BEFORE UPDATE ON audit_logs
                    BEGIN
                        SELECT RAISE(ABORT, 'COMPLIANCE VIOLATION: audit_logs records are strictly immutable.');
                    END;
                """))
                conn.execute(text("""
                    CREATE TRIGGER IF NOT EXISTS trg_audit_prevent_delete
                    BEFORE DELETE ON audit_logs
                    BEGIN
                        SELECT RAISE(ABORT, 'COMPLIANCE VIOLATION: audit_logs records are strictly immutable.');
                    END;
                """))
                conn.commit()
            except Exception:
                pass
