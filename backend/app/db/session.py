import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

Base = declarative_base()

def create_resilient_engine():
    global engine, SessionLocal
    db_url = settings.DATABASE_URL
    engine_kwargs = {"echo": False}
    
    if "sqlite" in db_url:
        connect_args = {"check_same_thread": False}
        eng = create_engine(db_url, connect_args=connect_args, **engine_kwargs)
        
        @event.listens_for(eng, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        return eng
    else:
        try:
            engine_kwargs.update({
                "pool_size": 10,
                "max_overflow": 20,
                "pool_recycle": 3600,
                "pool_pre_ping": True
            })
            eng = create_engine(db_url, **engine_kwargs)
            # Test connection
            with eng.connect() as conn:
                conn.execute(text("SELECT 1"))
            return eng
        except Exception as e:
            print(f"[Scanova DB] Remote database connection failed ({e}). Falling back to local SQLite.")
            sqlite_url = f"sqlite:///{settings._DEFAULT_DB_PATH}"
            eng = create_engine(sqlite_url, connect_args={"check_same_thread": False}, echo=False)
            return eng

engine = create_resilient_engine()
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
