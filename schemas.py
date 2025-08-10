from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class BookBase(BaseModel):
    """Base book schema with common fields"""
    title: str = Field(..., min_length=1, max_length=255, description="Book title")
    author: str = Field(..., min_length=1, max_length=255, description="Book author")
    genre: str = Field(..., min_length=1, max_length=100, description="Book genre")
    isbn: Optional[str] = Field(None, max_length=20, description="Book ISBN")

class BookCreate(BookBase):
    """Schema for creating a new book"""
    pass

class BookRead(BookBase):
    """Schema for reading book data"""
    id: int
    date_added: datetime
    
    class Config:
        orm_mode = True

class BookUpdate(BaseModel):
    """Schema for updating a book (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Book title")
    author: Optional[str] = Field(None, min_length=1, max_length=255, description="Book author")
    genre: Optional[str] = Field(None, min_length=1, max_length=100, description="Book genre")
    isbn: Optional[str] = Field(None, max_length=20, description="Book ISBN") 