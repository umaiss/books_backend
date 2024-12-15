import express, { Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import Book from './models/book';

config();

const app = express();
app.use(express.json());

// Root Route
app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to the Books API!');
});

// Create a new book
app.post('/books', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const book = new Book(req.body);
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        next(error);
    }
});

// get all boks
app.get('/books', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, sortBy = 'title', sortOrder = 'asc', ...filters } = req.query;

        const query = Object.keys(filters).length > 0 ? filters : {};

        const books = await Book.find(query)
            .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);

        const totalBooks = await Book.countDocuments(query);

        res.json({
            books,
            pagination: {
                total: totalBooks,
                page: +page,
                limit: +limit,
                totalPages: Math.ceil(totalBooks / +limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

// Get all books
app.get('/books', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (error) {
        next(error);
    }
});

// Update a book by ID
app.put('/books/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        next(error);
    }
});

// Delete a book by ID
app.delete('/books/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// Catch-all Route for Unknown Endpoints
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Central Error-Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// Start Server

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});