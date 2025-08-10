from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
import os

# Database URL - using SQLite for simplicity
DATABASE_URL = "sqlite:///./books.db"

# Create engine with SQLite configuration
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
    poolclass=StaticPool,  # Better for SQLite
    echo=False  # Set to True for SQL query logging
)

def create_db_and_tables():
    """Create database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session 