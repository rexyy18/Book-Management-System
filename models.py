from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Book(SQLModel, table=True):
    """Book model for database operations"""
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=255, description="Book title")
    author: str = Field(max_length=255, description="Book author")
    genre: str = Field(max_length=100, description="Book genre")
    isbn: Optional[str] = Field(default=None, max_length=20, description="Book ISBN")
    date_added: datetime = Field(default_factory=datetime.utcnow, description="Date when book was added")
    favorite: bool = Field(default=False, description="Is the book a favorite")
    createdAt: datetime = Field(default_factory=datetime.utcnow, nullable=False, description="Creation timestamp")
    
    class Config:
        schema_extra = {
            "example": {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "genre": "Fiction",
                "isbn": "978-0743273565"
            }
        }