// Book Manager - CRUD Application with localStorage
(function() {
    'use strict';

    // ===== DATA STORAGE =====
    const StorageService = {
        // Get all books from localStorage
        getAllBooks() {
            const books = localStorage.getItem('books');
            return books ? JSON.parse(books) : [];
        },

        // Save all books to localStorage
        saveAllBooks(books) {
            localStorage.setItem('books', JSON.stringify(books));
        },

        // Get a single book by ID
        getBook(id) {
            const books = this.getAllBooks();
            return books.find(book => book.id === id);
        },

        // Create a new book
        createBook(bookData) {
            const books = this.getAllBooks();
            const newBook = {
                id: Date.now().toString(), // Simple ID generation
                ...bookData,
                createdAt: new Date().toISOString()
            };
            books.push(newBook);
            this.saveAllBooks(books);
            return newBook;
        },

        // Update an existing book
        updateBook(id, bookData) {
            const books = this.getAllBooks();
            const index = books.findIndex(book => book.id === id);
            if (index !== -1) {
                books[index] = { ...books[index], ...bookData, updatedAt: new Date().toISOString() };
                this.saveAllBooks(books);
                return books[index];
            }
            throw new Error('Book not found');
        },

        // Delete a book
        deleteBook(id) {
            const books = this.getAllBooks();
            const filteredBooks = books.filter(book => book.id !== id);
            this.saveAllBooks(filteredBooks);
            return true;
        }
    };

    // ===== UI MANAGEMENT =====
    const UI = {
        elements: {
            // Main elements
            booksList: document.getElementById('booksList'),
            noBooksMessage: document.getElementById('noBooksMessage'),
            searchInput: document.getElementById('searchInput'),
            sortSelect: document.getElementById('sortSelect'),
            createBtn: document.getElementById('createBtn'),
            emptyStateCreateBtn: document.getElementById('emptyStateCreateBtn'),
            
            // Modals
            bookModal: document.getElementById('bookModal'),
            viewModal: document.getElementById('viewModal'),
            deleteModal: document.getElementById('deleteModal'),
            
            // Forms and content
            bookForm: document.getElementById('bookForm'),
            modalTitle: document.getElementById('modalTitle'),
            bookDetails: document.getElementById('bookDetails'),
            deleteBookTitle: document.getElementById('deleteBookTitle'),
            
            // Stats
            totalBooks: document.getElementById('totalBooks'),
            totalGenres: document.getElementById('totalGenres')
        },

        currentBookId: null,
        allBooks: [],

        init() {
            this.bindEvents();
            this.loadBooks();
            this.addSampleData(); // Add some sample data if empty
        },

        bindEvents() {
            // Search functionality
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            // Sort functionality
            this.elements.sortSelect.addEventListener('change', (e) => {
                this.handleSort(e.target.value);
            });

            // Create book button
            this.elements.createBtn.addEventListener('click', () => {
                this.openCreateModal();
            });

            // Empty state create button
            this.elements.emptyStateCreateBtn.addEventListener('click', () => {
                this.openCreateModal();
            });

            // Form submission
            this.elements.bookForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });

            // Modal close buttons
            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeAllModals();
                });
            });

            // Cancel buttons
            document.querySelectorAll('#cancelBtn, #cancelDeleteBtn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeAllModals();
                });
            });

            // Modal backdrop clicks
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                backdrop.addEventListener('click', () => {
                    this.closeAllModals();
                });
            });

            // Edit and delete buttons in view modal
            document.getElementById('editBookBtn').addEventListener('click', () => {
                if (this.currentBookId) {
                    this.closeAllModals();
                    this.openEditModal(this.currentBookId);
                }
            });

            document.getElementById('deleteBookBtn').addEventListener('click', () => {
                if (this.currentBookId) {
                    this.closeAllModals();
                    this.openDeleteModal(this.currentBookId);
                }
            });

            // Confirm delete button
            document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
                if (this.currentBookId) {
                    this.handleDelete(this.currentBookId);
                }
            });

            // Escape key to close modals
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeAllModals();
                }
            });
        },

        loadBooks() {
            try {
                this.showLoading();
                this.allBooks = StorageService.getAllBooks();
                this.renderBooks(this.allBooks);
                this.updateStats(this.allBooks);
            } catch (error) {
                this.showError('Failed to load books: ' + error.message);
            } finally {
                this.hideLoading();
            }
        },

        addSampleData() {
            const books = StorageService.getAllBooks();
            if (books.length === 0) {
                const sampleBooks = [
                    {
                        title: "The Great Gatsby",
                        author: "F. Scott Fitzgerald",
                        genre: "Fiction",
                        isbn: "978-0743273565"
                    },
                    {
                        title: "To Kill a Mockingbird",
                        author: "Harper Lee",
                        genre: "Fiction",
                        isbn: "978-0446310789"
                    },
                    {
                        title: "1984",
                        author: "George Orwell",
                        genre: "Science Fiction",
                        isbn: "978-0451524935"
                    },
                    {
                        title: "Pride and Prejudice",
                        author: "Jane Austen",
                        genre: "Romance",
                        isbn: "978-0141439518"
                    },
                    {
                        title: "The Hobbit",
                        author: "J.R.R. Tolkien",
                        genre: "Fantasy",
                        isbn: "978-0547928241"
                    }
                ];

                sampleBooks.forEach(book => {
                    StorageService.createBook(book);
                });

                this.loadBooks();
                this.showSuccess('Sample books added to your library!');
            }
        },

        showLoading() {
            this.elements.booksList.innerHTML = '<div class="loading">Loading books...</div>';
        },

        hideLoading() {
            // Loading state is handled by renderBooks
        },

        renderBooks(books) {
            if (books.length === 0) {
                this.elements.booksList.style.display = 'none';
                this.elements.noBooksMessage.style.display = 'block';
                return;
            }

            this.elements.booksList.style.display = 'grid';
            this.elements.noBooksMessage.style.display = 'none';

            this.elements.booksList.innerHTML = books.map(book => this.createBookCard(book)).join('');
            this.bindCardEvents();
        },

        createBookCard(book) {
            return `
                <div class="book-card" data-id="${book.id}">
                    <div class="book-header">
                        <div>
                            <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                            <p class="book-author">by ${this.escapeHtml(book.author)}</p>
                        </div>
                        <div class="book-actions">
                            <button class="action-btn" data-action="view" title="View Details">👁️</button>
                            <button class="action-btn" data-action="edit" title="Edit Book">✏️</button>
                            <button class="action-btn action-btn--danger" data-action="delete" title="Delete Book">🗑️</button>
                        </div>
                    </div>
                    <div class="book-details">
                        <div class="book-detail">
                            <span class="book-detail-label">Genre:</span>
                            <span class="book-genre">${this.escapeHtml(book.genre)}</span>
                        </div>
                        ${book.isbn ? `
                        <div class="book-detail">
                            <span class="book-detail-label">ISBN:</span>
                            <span class="book-detail-value">${this.escapeHtml(book.isbn)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        },

        bindCardEvents() {
            document.querySelectorAll('.book-card').forEach(card => {
                const bookId = card.dataset.id;
                
                card.querySelectorAll('.action-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const action = btn.dataset.action;
                        this.handleCardAction(action, bookId);
                    });
                });
            });
        },

        handleCardAction(action, bookId) {
            switch (action) {
                case 'view':
                    this.openViewModal(bookId);
                    break;
                case 'edit':
                    this.openEditModal(bookId);
                    break;
                case 'delete':
                    this.openDeleteModal(bookId);
                    break;
            }
        },

        updateStats(books) {
            const totalBooks = books.length;
            const uniqueGenres = new Set(books.map(book => book.genre)).size;
            
            this.elements.totalBooks.textContent = totalBooks;
            this.elements.totalGenres.textContent = uniqueGenres;
        },

        openCreateModal() {
            this.currentBookId = null;
            this.elements.modalTitle.textContent = 'Add New Book';
            this.elements.bookForm.reset();
            this.openModal(this.elements.bookModal);
        },

        openEditModal(bookId) {
            try {
                const book = StorageService.getBook(bookId);
                if (!book) {
                    this.showError('Book not found');
                    return;
                }

                this.currentBookId = bookId;
                this.elements.modalTitle.textContent = 'Edit Book';
                
                // Fill form with book data
                document.getElementById('bookTitle').value = book.title;
                document.getElementById('bookAuthor').value = book.author;
                document.getElementById('bookGenre').value = book.genre;
                document.getElementById('bookIsbn').value = book.isbn || '';
                
                this.openModal(this.elements.bookModal);
            } catch (error) {
                this.showError('Failed to load book details: ' + error.message);
            }
        },

        openViewModal(bookId) {
            try {
                const book = StorageService.getBook(bookId);
                if (!book) {
                    this.showError('Book not found');
                    return;
                }

                this.currentBookId = bookId;
                
                this.elements.bookDetails.innerHTML = `
                    <div class="book-detail">
                        <span class="book-detail-label">Title:</span>
                        <span class="book-detail-value">${this.escapeHtml(book.title)}</span>
                    </div>
                    <div class="book-detail">
                        <span class="book-detail-label">Author:</span>
                        <span class="book-detail-value">${this.escapeHtml(book.author)}</span>
                    </div>
                    <div class="book-detail">
                        <span class="book-detail-label">Genre:</span>
                        <span class="book-detail-value">${this.escapeHtml(book.genre)}</span>
                    </div>
                    ${book.isbn ? `
                    <div class="book-detail">
                        <span class="book-detail-label">ISBN:</span>
                        <span class="book-detail-value">${this.escapeHtml(book.isbn)}</span>
                    </div>
                    ` : ''}
                `;
                
                this.openModal(this.elements.viewModal);
            } catch (error) {
                this.showError('Failed to load book details: ' + error.message);
            }
        },

        openDeleteModal(bookId) {
            try {
                const book = StorageService.getBook(bookId);
                if (!book) {
                    this.showError('Book not found');
                    return;
                }

                this.currentBookId = bookId;
                this.elements.deleteBookTitle.textContent = book.title;
                this.openModal(this.elements.deleteModal);
            } catch (error) {
                this.showError('Failed to load book details: ' + error.message);
            }
        },

        handleFormSubmit() {
            const formData = new FormData(this.elements.bookForm);
            const bookData = {
                title: formData.get('title').trim(),
                author: formData.get('author').trim(),
                genre: formData.get('genre'),
                isbn: formData.get('isbn').trim() || null
            };

            // Basic validation
            if (!bookData.title || !bookData.author || !bookData.genre) {
                this.showError('Please fill in all required fields.');
                return;
            }

            try {
                if (this.currentBookId) {
                    StorageService.updateBook(this.currentBookId, bookData);
                    this.showSuccess('Book updated successfully!');
                } else {
                    StorageService.createBook(bookData);
                    this.showSuccess('Book added successfully!');
                }
                
                this.closeAllModals();
                this.loadBooks();
            } catch (error) {
                this.showError('Failed to save book: ' + error.message);
            }
        },

        handleDelete(bookId) {
            try {
                StorageService.deleteBook(bookId);
                this.showSuccess('Book deleted successfully!');
                this.closeAllModals();
                this.loadBooks();
            } catch (error) {
                this.showError('Failed to delete book: ' + error.message);
            }
        },

        handleSearch(query) {
            const filteredBooks = this.allBooks.filter(book => 
                book.title.toLowerCase().includes(query.toLowerCase()) ||
                book.author.toLowerCase().includes(query.toLowerCase()) ||
                book.genre.toLowerCase().includes(query.toLowerCase()) ||
                (book.isbn && book.isbn.toLowerCase().includes(query.toLowerCase()))
            );
            this.renderBooks(filteredBooks);
        },

        handleSort(sortBy) {
            const sortedBooks = [...this.allBooks].sort((a, b) => {
                switch (sortBy) {
                    case 'title':
                        return a.title.localeCompare(b.title);
                    case 'author':
                        return a.author.localeCompare(b.author);
                    case 'genre':
                        return a.genre.localeCompare(b.genre);
                    case 'date':
                    default:
                        return new Date(b.createdAt) - new Date(a.createdAt);
                }
            });
            this.renderBooks(sortedBooks);
        },

        openModal(modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        },

        closeModal(modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        },

        closeAllModals() {
            document.querySelectorAll('.modal').forEach(modal => {
                this.closeModal(modal);
            });
        },

        showSuccess(message) {
            this.showNotification(message, 'success');
        },

        showError(message) {
            this.showNotification(message, 'error');
        },

        showNotification(message, type = 'info') {
            const container = document.getElementById('notificationContainer');
            const notification = document.createElement('div');
            notification.className = `notification notification--${type}`;
            notification.textContent = message;
            
            container.appendChild(notification);
            
            // Trigger animation
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', () => {
        UI.init();
    });

})(); 