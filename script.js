// Book Manager - CRUD Application with localStorage + Enhanced Features + Scroll Effects
(function () {
    'use strict';

    // ===== DATA STORAGE =====
    const StorageService = {
        getAllBooks() {
            const books = localStorage.getItem('books');
            return books ? JSON.parse(books) : [];
        },
        saveAllBooks(books) {
            localStorage.setItem('books', JSON.stringify(books));
        },
        getBook(id) {
            const books = this.getAllBooks();
            return books.find(book => book.id === id);
        },
        createBook(bookData) {
            const books = this.getAllBooks();
            const newBook = {
                id: Date.now().toString(),
                ...bookData,
                createdAt: new Date().toISOString(),
                favorite: false
            };
            books.push(newBook);
            this.saveAllBooks(books);
            return newBook;
        },
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
        deleteBook(id) {
            const books = this.getAllBooks();
            const filteredBooks = books.filter(book => book.id !== id);
            this.saveAllBooks(filteredBooks);
            return true;
        },
        toggleFavorite(id) {
            const books = this.getAllBooks();
            const index = books.findIndex(book => book.id === id);
            if (index !== -1) {
                books[index].favorite = !books[index].favorite;
                this.saveAllBooks(books);
                return books[index].favorite;
            }
            throw new Error('Book not found');
        },
        exportBooks() {
            return JSON.stringify(this.getAllBooks(), null, 2);
        },
        importBooks(json) {
            let imported = [];
            try {
                imported = JSON.parse(json);
                if (!Array.isArray(imported)) throw new Error();
            } catch {
                throw new Error('Invalid JSON format');
            }
            this.saveAllBooks(imported);
        }
    };

    // ===== THEME MANAGEMENT =====
    const ThemeService = {
        getTheme() {
            return localStorage.getItem('theme') || 'light';
        },
        setTheme(theme) {
            localStorage.setItem('theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
        },
        toggleTheme() {
            const newTheme = this.getTheme() === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },
        init() {
            this.setTheme(this.getTheme());
        }
    };

    // ===== UI MANAGEMENT =====
    const UI = {
        elements: {
            booksList: document.getElementById('booksList'),
            noBooksMessage: document.getElementById('noBooksMessage'),
            searchInput: document.getElementById('searchInput'),
            sortSelect: document.getElementById('sortSelect'),
            createBtn: document.getElementById('createBtn'),
            emptyStateCreateBtn: document.getElementById('emptyStateCreateBtn'),
            bookModal: document.getElementById('bookModal'),
            viewModal: document.getElementById('viewModal'),
            deleteModal: document.getElementById('deleteModal'),
            bookForm: document.getElementById('bookForm'),
            modalTitle: document.getElementById('modalTitle'),
            bookDetails: document.getElementById('bookDetails'),
            deleteBookTitle: document.getElementById('deleteBookTitle'),
            totalBooks: document.getElementById('totalBooks'),
            totalGenres: document.getElementById('totalGenres'),
            genreFilter: document.getElementById('genreFilter'),
            notificationContainer: document.getElementById('notificationContainer'),
            themeToggle: document.getElementById('themeToggle'),
            exportBtn: document.getElementById('exportBtn'),
            importBtn: document.getElementById('importBtn'),
            importInput: document.getElementById('importInput')
        },

        currentBookId: null,
        allBooks: [],
        lastDeletedBook: null,
        lastDeletedTimeout: null,
        currentGenre: 'all',

        init() {
            ThemeService.init();
            this.bindEvents();
            this.loadBooks();
            this.addSampleData();
            this.renderGenreFilter();
        },

        bindEvents() {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            this.elements.sortSelect.addEventListener('change', (e) => {
                this.handleSort(e.target.value);
            });

            this.elements.createBtn.addEventListener('click', () => {
                this.openCreateModal();
            });

            this.elements.emptyStateCreateBtn.addEventListener('click', () => {
                this.openCreateModal();
            });

            this.elements.bookForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });

            document.querySelectorAll('.modal-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeAllModals();
                });
            });

            document.querySelectorAll('#cancelBtn, #cancelDeleteBtn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeAllModals();
                });
            });

            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                backdrop.addEventListener('click', () => {
                    this.closeAllModals();
                });
            });

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

            document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
                if (this.currentBookId) {
                    this.handleDelete(this.currentBookId);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeAllModals();
                }
                // Keyboard shortcuts
                if (e.key === 'n' && !document.body.classList.contains('modal-open')) {
                    this.openCreateModal();
                }
                if (e.key === '/' && document.activeElement !== this.elements.searchInput) {
                    e.preventDefault();
                    this.elements.searchInput.focus();
                }
            });

            // Theme toggle
            if (this.elements.themeToggle) {
                this.elements.themeToggle.addEventListener('click', () => {
                    ThemeService.toggleTheme();
                });
            }

            // Genre filter
            if (this.elements.genreFilter) {
                this.elements.genreFilter.addEventListener('change', (e) => {
                    this.currentGenre = e.target.value;
                    this.renderBooks(this.filterBooks(this.allBooks));
                });
            }

            // Export/Import
            if (this.elements.exportBtn) {
                this.elements.exportBtn.addEventListener('click', () => {
                    const data = StorageService.exportBooks();
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'books.json';
                    a.click();
                    URL.revokeObjectURL(url);
                });
            }
            if (this.elements.importBtn && this.elements.importInput) {
                this.elements.importBtn.addEventListener('click', () => {
                    this.elements.importInput.click();
                });
                this.elements.importInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            StorageService.importBooks(evt.target.result);
                            this.showSuccess('Books imported!');
                            this.loadBooks();
                        } catch (err) {
                            this.showError('Import failed: ' + err.message);
                        }
                    };
                    reader.readAsText(file);
                });
            }
        },

        loadBooks() {
            try {
                this.showLoading();
                this.allBooks = StorageService.getAllBooks();
                this.renderBooks(this.filterBooks(this.allBooks));
                this.updateStats(this.allBooks);
                this.renderGenreFilter();
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
                <div class="book-card animate-on-scroll" data-id="${book.id}">
                    <div class="book-header">
                        <div>
                            <h3 class="book-title reveal-text">${this.escapeHtml(book.title)}</h3>
                            <p class="book-author">by <span class="reveal-text">${this.escapeHtml(book.author)}</span></p>
                        </div>
                        <div class="book-actions">
                            <button class="action-btn" data-action="view" title="View Details">👁️</button>
                            <button class="action-btn" data-action="edit" title="Edit Book">✏️</button>
                            <button class="action-btn action-btn--danger" data-action="delete" title="Delete Book">🗑️</button>
                            <button class="action-btn action-btn--favorite" data-action="favorite" title="Toggle Favorite">${book.favorite ? '⭐' : '☆'}</button>
                        </div>
                    </div>
                    <div class="book-details scroll-3d">
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
                        ${book.favorite ? `
                        <div class="book-detail">
                            <span class="book-detail-label">Favorite:</span>
                            <span class="book-detail-value">⭐</span>
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
                        this.handleCardAction(action, bookId, btn);
                    });
                });
            });
        },

        handleCardAction(action, bookId, btn) {
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
                case 'favorite':
                    const isFav = StorageService.toggleFavorite(bookId);
                    btn.innerHTML = isFav ? '⭐' : '☆';
                    this.loadBooks();
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
                    ${book.favorite ? `
                    <div class="book-detail">
                        <span class="book-detail-label">Favorite:</span>
                        <span class="book-detail-value">⭐</span>
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
                this.lastDeletedBook = StorageService.getBook(bookId);
                StorageService.deleteBook(bookId);
                this.showUndoNotification('Book deleted! ', 'Undo', () => {
                    if (this.lastDeletedBook) {
                        const books = StorageService.getAllBooks();
                        books.push(this.lastDeletedBook);
                        StorageService.saveAllBooks(books);
                        this.lastDeletedBook = null;
                        this.loadBooks();
                        this.showSuccess('Book restored!');
                    }
                });
                this.closeAllModals();
                this.loadBooks();
            } catch (error) {
                this.showError('Failed to delete book: ' + error.message);
            }
        },

        handleSearch(query) {
            this.renderBooks(this.filterBooks(this.allBooks, query));
        },

        handleSort(sortBy) {
            const sortedBooks = [...this.filterBooks(this.allBooks)].sort((a, b) => {
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

        filterBooks(books, query = this.elements.searchInput.value) {
            let filtered = books;
            if (this.currentGenre && this.currentGenre !== 'all') {
                filtered = filtered.filter(book => book.genre === this.currentGenre);
            }
            if (query) {
                filtered = filtered.filter(book =>
                    book.title.toLowerCase().includes(query.toLowerCase()) ||
                    book.author.toLowerCase().includes(query.toLowerCase()) ||
                    book.genre.toLowerCase().includes(query.toLowerCase()) ||
                    (book.isbn && book.isbn.toLowerCase().includes(query.toLowerCase()))
                );
            }
            return filtered;
        },

        openModal(modal) {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
        },

        closeModal(modal) {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
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
            const container = this.elements.notificationContainer;
            const notification = document.createElement('div');
            notification.className = `notification notification--${type}`;
            notification.textContent = message;

            container.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('show');
            }, 100);

            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        },

        showUndoNotification(message, actionText, onUndo) {
            const container = this.elements.notificationContainer;
            const notification = document.createElement('div');
            notification.className = `notification notification--warning`;
            notification.innerHTML = `${message}<button class="undo-btn">${actionText}</button>`;

            container.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('show');
            }, 100);

            const undoBtn = notification.querySelector('.undo-btn');
            let undone = false;
            undoBtn.addEventListener('click', () => {
                if (!undone) {
                    undone = true;
                    onUndo();
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            });

            setTimeout(() => {
                if (!undone) {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }, 4000);
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },

        renderGenreFilter() {
            if (!this.elements.genreFilter) return;
            const books = StorageService.getAllBooks();
            const genres = Array.from(new Set(books.map(book => book.genre))).sort();
            this.elements.genreFilter.innerHTML = `<option value="all">All Genres</option>` +
                genres.map(g => `<option value="${this.escapeHtml(g)}">${this.escapeHtml(g)}</option>`).join('');
        }
    };

    // ===== Scroll-Based Effects =====

    // 1. Scroll-triggered animations (.animate-on-scroll)
    function initScrollAnimations() {
        const animatedEls = document.querySelectorAll('.animate-on-scroll');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                } else {
                    entry.target.classList.remove('active');
                }
            });
        }, { threshold: 0.1 });
        animatedEls.forEach(el => observer.observe(el));
    }

    // 2. Progress indicator (top progress bar)
    function initScrollProgressBar() {
        if (!document.getElementById('scroll-progress-bar')) {
            const bar = document.createElement('div');
            bar.id = 'scroll-progress-bar';
            bar.style.position = 'fixed';
            bar.style.top = '0';
            bar.style.left = '0';
            bar.style.height = '4px';
            bar.style.width = '0%';
            bar.style.background = 'linear-gradient(90deg, #2563eb 0%, #a21caf 100%)';
            bar.style.zIndex = '9999';
            bar.style.transition = 'width 0.2s cubic-bezier(.4,0,.2,1)';
            document.body.appendChild(bar);
        }
        const bar = document.getElementById('scroll-progress-bar');
        function updateBar() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = percent + '%';
            requestAnimationFrame(updateBar);
        }
        requestAnimationFrame(updateBar);
    }

    // 3. Text reveal effect (.reveal-text)
    function initTextReveal() {
        const revealEls = document.querySelectorAll('.reveal-text');
        revealEls.forEach(el => {
            if (!el.dataset.revealed) {
                const text = el.textContent;
                el.innerHTML = '';
                text.split('').forEach((char, i) => {
                    const span = document.createElement('span');
                    span.textContent = char;
                    span.style.opacity = '0';
                    span.style.transition = 'opacity 0.3s ' + (i * 0.04) + 's';
                    el.appendChild(span);
                });
                el.dataset.revealed = 'true';
            }
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const spans = entry.target.querySelectorAll('span');
                    spans.forEach(span => span.style.opacity = '1');
                } else {
                    const spans = entry.target.querySelectorAll('span');
                    spans.forEach(span => span.style.opacity = '0');
                }
            });
        }, { threshold: 0.1 });
        revealEls.forEach(el => observer.observe(el));
    }

    // 4. Background color change (.color-section)
    function initBgColorSections() {
        const sections = document.querySelectorAll('.color-section');
        let lastColor = getComputedStyle(document.body).backgroundColor;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const color = entry.target.dataset.bgcolor || lastColor;
                    animateBodyBgColor(color);
                    lastColor = color;
                }
            });
        }, { threshold: [0.5] });

        sections.forEach(section => observer.observe(section));

        let animating = false;
        function animateBodyBgColor(targetColor) {
            if (animating) return;
            animating = true;
            const body = document.body;
            const startColor = rgbToArr(getComputedStyle(body).backgroundColor);
            const endColor = rgbToArr(targetColor);
            let t = 0;
            function step() {
                t += 0.07;
                if (t > 1) t = 1;
                const curr = startColor.map((c, i) => Math.round(c + (endColor[i] - c) * t));
                body.style.backgroundColor = `rgb(${curr[0]},${curr[1]},${curr[2]})`;
                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    animating = false;
                }
            }
            requestAnimationFrame(step);
        }
        function rgbToArr(rgb) {
            const m = rgb.match(/\d+/g);
            return m ? m.slice(0, 3).map(Number) : [255,255,255];
        }
    }

    // 5. 3D transform scroll (.scroll-3d)
    function initScroll3d() {
        const els = document.querySelectorAll('.scroll-3d');
        function update3d() {
            els.forEach(el => {
                const rect = el.getBoundingClientRect();
                const windowH = window.innerHeight;
                const center = rect.top + rect.height / 2 - windowH / 2;
                const norm = Math.max(-1, Math.min(1, center / (windowH / 2)));
                el.style.transform = `perspective(600px) rotateY(${norm * 30}deg) rotateX(${norm * 10}deg)`;
                el.style.transition = 'transform 0.2s cubic-bezier(.4,0,.2,1)';
            });
            requestAnimationFrame(update3d);
        }
        requestAnimationFrame(update3d);
    }
    

    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', () => {
        UI.init();
        // Scroll-based effects
        initScrollAnimations();
        initScrollProgressBar();
        initTextReveal();
        initBgColorSections();
        initScroll3d();
    });


})();