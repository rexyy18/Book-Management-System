<<<<<<< HEAD
HEAD
# Book Manager Backend API

A clean FastAPI backend for the Book Manager CRUD application with SQLite database and proper validation.

## 🚀 Features

- **RESTful API** with all CRUD operations
- **SQLite Database** with SQLModel ORM
- **Data Validation** using Pydantic schemas
- **CORS Support** for frontend integration
- **Auto-generated API Documentation**
- **Production-ready** structure

## 📁 Project Structure

```
backend/
├── main.py          # FastAPI application and endpoints
├── models.py        # SQLModel database models
├── schemas.py       # Pydantic validation schemas
├── database.py      # Database configuration
├── requirements.txt # Python dependencies
└── README.md       # This file
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Access the API

- **API Base URL**: `http://localhost:8000`
- **Interactive Documentation**: `http://localhost:8000/docs`
- **Alternative Documentation**: `http://localhost:8000/redoc`

## 📚 API Endpoints

### Health Check
- `GET /` - Check if API is running

### Books CRUD
- `POST /books` - Create a new book
- `GET /books` - Get all books
- `GET /books/{id}` - Get a specific book
- `PUT /books/{id}` - Update a book
- `DELETE /books/{id}` - Delete a book

## 🧪 Testing with curl

### Create a Book
```bash
curl -X POST "http://localhost:8000/books" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "The Great Gatsby",
       "author": "F. Scott Fitzgerald",
       "genre": "Fiction",
       "isbn": "978-0743273565"
     }'
```

### Get All Books
```bash
curl -X GET "http://localhost:8000/books"
```

### Get a Specific Book
```bash
curl -X GET "http://localhost:8000/books/1"
```

### Update a Book
```bash
curl -X PUT "http://localhost:8000/books/1" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Updated Title",
       "author": "Updated Author",
       "genre": "Non-Fiction"
     }'
```

### Delete a Book
```bash
curl -X DELETE "http://localhost:8000/books/1"
```

## 🗄️ Database

- **Type**: SQLite
- **File**: `books.db` (created automatically)
- **ORM**: SQLModel (built on SQLAlchemy)
- **Migrations**: Automatic table creation on startup

## 🔧 Configuration

### Environment Variables (Optional)
- `DATABASE_URL`: Override default SQLite database URL
- `CORS_ORIGINS`: Specify allowed frontend origins

### Database Schema
```sql
CREATE TABLE book (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    isbn VARCHAR(20),
    date_added DATETIME NOT NULL
);
```

## 🚀 Production Deployment

### Using Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Gunicorn
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 🔗 Frontend Integration

The API is configured with CORS to work with your frontend. Update the frontend JavaScript to use these endpoints:

```javascript
// Example API calls
const API_BASE = 'http://localhost:8000';

// Get all books
const books = await fetch(`${API_BASE}/books`).then(r => r.json());

// Create a book
const newBook = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData)
}).then(r => r.json());
```

## 📊 API Response Examples

### Success Response
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "genre": "Fiction",
  "isbn": "978-0743273565",
  "date_added": "2024-01-15T10:30:00"
}
```

### Error Response
```json
{
  "detail": "Book not found"
}
```

## 🔍 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These provide interactive documentation where you can test all endpoints directly.

## 🛡️ Security Features

- **Input Validation**: All requests validated with Pydantic
- **SQL Injection Protection**: Using SQLModel ORM
- **CORS Configuration**: Properly configured for frontend
- **Error Handling**: Meaningful HTTP status codes and messages

## 📝 Development Notes

- Database is automatically created on first run
- All endpoints return proper HTTP status codes
- Validation errors return 422 status code
- Not found errors return 404 status code
- Server errors return 500 status code 
=======
# Book-Management-System
To create , review , update  and delete any book in the database
>>>>>>> 8af5486127f711b4537fba0baf7e2999f13d8154
=======

>>>>>>> c48b5d0b07dafc1ac6124f7dcdfc4d994dd6fcf8
