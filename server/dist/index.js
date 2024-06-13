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
require("dotenv/config");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
mongoose_1.default.connect('mongodb+srv://arl:arl@cluster1.unitqkr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1');
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
        $('.css-ye6x8s .css-1l4spti').each((_, element) => {
            const title = $(element).find('h2').text();
            const url = $(element).find('a').attr('href');
            const abstract = $(element).find('p').text();
            const published_date = new Date();
            if (title && url && abstract) {
                articles.push({
                    title,
                    url: `https://www.nytimes.com${url}`,
                    abstract,
                    published_date,
                });
            }
        });
        console.log('Fetched Articles:', articles);
        await Article.insertMany(articles);
        console.log('Articles fetched and saved.');
    }
    catch (error) {
        console.error('Error fetching articles:', error);
    }
};
const node_cron_1 = __importDefault(require("node-cron"));
node_cron_1.default.schedule('*/30 * * * *', fetchArticles); // Change to every 30 minutes
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await Article.find().sort({ published_date: -1 }).limit(10);
        console.log('Retrieved Articles:', articles);
        res.json(articles);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
