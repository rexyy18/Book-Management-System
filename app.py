from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
DATABASE = 'books.db'

def init_db():
    """Initialize the database with the books table"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            genre TEXT NOT NULL,
            isbn TEXT,
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_db_connection():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

@app.route('/')
def health_check():
    """Health check endpoint"""
    return jsonify({"message": "Book Manager API is running!", "version": "1.0.0"})

@app.route('/books', methods=['GET'])
def get_books():
    """Get all books"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM books ORDER BY date_added DESC')
        books = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        books_list = []
        for book in books:
            books_list.append({
                'id': book['id'],
                'title': book['title'],
                'author': book['author'],
                'genre': book['genre'],
                'isbn': book['isbn'],
                'date_added': book['date_added']
            })
        
        return jsonify(books_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    """Get a single book by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM books WHERE id = ?', (book_id,))
        book = cursor.fetchone()
        conn.close()
        
        if book is None:
            return jsonify({"error": "Book not found"}), 404
        
        return jsonify({
            'id': book['id'],
            'title': book['title'],
            'author': book['author'],
            'genre': book['genre'],
            'isbn': book['isbn'],
            'date_added': book['date_added']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/books', methods=['POST'])
def create_book():
    """Create a new book"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('title') or not data.get('author') or not data.get('genre'):
            return jsonify({"error": "Title, author, and genre are required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO books (title, author, genre, isbn)
            VALUES (?, ?, ?, ?)
        ''', (data['title'], data['author'], data['genre'], data.get('isbn')))
        
        book_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Return the created book
        return get_book(book_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    """Update an existing book"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if book exists
        cursor.execute('SELECT * FROM books WHERE id = ?', (book_id,))
        book = cursor.fetchone()
        if book is None:
            conn.close()
            return jsonify({"error": "Book not found"}), 404
        
        # Update only provided fields
        update_fields = []
        values = []
        
        if 'title' in data:
            update_fields.append('title = ?')
            values.append(data['title'])
        if 'author' in data:
            update_fields.append('author = ?')
            values.append(data['author'])
        if 'genre' in data:
            update_fields.append('genre = ?')
            values.append(data['genre'])
        if 'isbn' in data:
            update_fields.append('isbn = ?')
            values.append(data['isbn'])
        
        if update_fields:
            values.append(book_id)
            query = f'UPDATE books SET {", ".join(update_fields)} WHERE id = ?'
            cursor.execute(query, values)
            conn.commit()
        
        conn.close()
        
        # Return the updated book
        return get_book(book_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    """Delete a book"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if book exists
        cursor.execute('SELECT * FROM books WHERE id = ?', (book_id,))
        book = cursor.fetchone()
        if book is None:
            conn.close()
            return jsonify({"error": "Book not found"}), 404
        
        # Delete the book
        cursor.execute('DELETE FROM books WHERE id = ?', (book_id,))
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Book deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=8000) 