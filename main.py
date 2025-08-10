from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List
import uvicorn

from database import create_db_and_tables, get_session
from models import Book
from schemas import BookCreate, BookRead, BookUpdate

app = FastAPI(
    title="Book Manager API",
    description="A simple CRUD API for managing books",
    version="1.0.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    create_db_and_tables()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Book Manager API is running!", "version": "1.0.0"}

@app.post("/books", response_model=BookRead, status_code=201)
async def create_book(book: BookCreate, session: Session = Depends(get_session)):
    """
    Create a new book
    
    Example with curl:
    curl -X POST "http://localhost:8000/books" \
         -H "Content-Type: application/json" \
         -d '{"title": "The Great Gatsby", "author": "F. Scott Fitzgerald", "genre": "Fiction", "isbn": "978-0743273565"}'
    """
    db_book = Book.from_orm(book)
    session.add(db_book)
    session.commit()
    session.refresh(db_book)
    return db_book

@app.get("/books", response_model=List[BookRead])
async def get_books(session: Session = Depends(get_session)):
    """
    Get all books
    
    Example with curl:
    curl -X GET "http://localhost:8000/books"
    """
    books = session.exec(select(Book)).all()
    return books

@app.get("/books/{book_id}", response_model=BookRead)
async def get_book(book_id: int, session: Session = Depends(get_session)):
    """
    Get a single book by ID
    
    Example with curl:
    curl -X GET "http://localhost:8000/books/1"
    """
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@app.put("/books/{book_id}", response_model=BookRead)
async def update_book(book_id: int, book_update: BookUpdate, session: Session = Depends(get_session)):
    """
    Update a book by ID
    
    Example with curl:
    curl -X PUT "http://localhost:8000/books/1" \
         -H "Content-Type: application/json" \
         -d '{"title": "Updated Title", "author": "Updated Author", "genre": "Non-Fiction", "isbn": "978-1234567890"}'
    """
    db_book = session.get(Book, book_id)
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Update only provided fields
    book_data = book_update.dict(exclude_unset=True)
    for field, value in book_data.items():
        setattr(db_book, field, value)
    
    session.add(db_book)
    session.commit()
    session.refresh(db_book)
    return db_book

@app.delete("/books/{book_id}")
async def delete_book(book_id: int, session: Session = Depends(get_session)):
    """
    Delete a book by ID
    
    Example with curl:
    curl -X DELETE "http://localhost:8000/books/1"
    """
    book = session.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    session.delete(book)
    session.commit()
    return {"message": "Book deleted successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 