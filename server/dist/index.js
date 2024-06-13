"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
require("dotenv/config");
const node_cron_1 = __importDefault(require("node-cron"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "https://nyt-news-app-six.vercel.app",
        methods: ["GET", "POST"]
    }
});
app.use((0, cors_1.default)({
    origin: "http://localhost:3000"
}));
app.use(express_1.default.json());
mongoose_1.default.connect('mongodb+srv://arl:arl@cluster1.unitqkr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1').then(() => {
    console.log("MongoDB connected");
}).catch((error) => {
    console.error("MongoDB connection error:", error);
});
const articleSchema = new mongoose_1.default.Schema({
    title: String,
    url: String,
    abstract: String,
    published_date: Date,
});
const Article = mongoose_1.default.model('Article', articleSchema);
const fetchArticles = async () => {
    try {
        const response = await axios_1.default.get('https://www.nytimes.com/section/world');
        const html = response.data;
        const $ = cheerio_1.default.load(html);
        const articles = [];
        const elements = $('.css-18yolpw').slice(0, 5);
        elements.each((index, element) => {
            const title = $(element).find('h3').text();
            const url = $(element).find('a').attr('href');
            const abstract = $(element).find('p').text();
            const published_date = new Date();
            if (title && url && abstract) {
                const article = {
                    title,
                    url: `https://www.nytimes.com${url}`,
                    abstract,
                    published_date,
                };
                articles.push(article);
            }
        });
        if (articles.length > 0) {
            await Article.insertMany(articles);
            articles.forEach(article => io.emit('newArticle', article));
            console.log('Articles fetched and saved.');
        }
        else {
            console.error('No articles were found. Check the CSS selectors.');
        }
    }
    catch (error) {
        console.error('Error fetching articles:', error);
    }
};
node_cron_1.default.schedule('0 * * * *', fetchArticles); // Run every 15 seconds
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await Article.find().sort({ published_date: -1 }).limit(5);
        res.json(articles);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    fetchArticles(); // Initial scrape when server starts
});
