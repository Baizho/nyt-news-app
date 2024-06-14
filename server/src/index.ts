import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import 'dotenv/config';
import cron from 'node-cron';
import mongoose from 'mongoose';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://nyt-news-app-articles.vercel.app/",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: "https://nyt-news-app-articles.vercel.app/"
}));
app.use(express.json());

mongoose.connect('mongodb+srv://bossnurmyrza:JwdfOtPpTmGOb00h@cluster2.ocucg7c.mongodb.net/').then(() => {
  console.log("MongoDB connected");
}).catch((error: any) => {
  console.error("MongoDB connection error:", error);
});

const articleSchema = new mongoose.Schema({
  title: String,
  url: String,
  abstract: String,
  published_date: Date,
});

const Article = mongoose.model('Article', articleSchema);

interface Article {
  title: string;
  url: string;
  abstract: string;
  published_date: Date;
}

const fetchArticles = async () => {
  try {
    const response = await axios.get('https://www.nytimes.com/international/section/technology');
    const html = response.data;
    const $ = cheerio.load(html);

    const articles: Article[] = [];
    const elements = $('.css-18yolpw').slice(0, 10); 

    elements.each((index, element) => {
      const title = $(element).find('h3').text();
      const url = $(element).find('a').attr('href');
      const abstract = $(element).find('p').text();
      const published_date = new Date();

      if (title && url && abstract) {
        const article: Article = {
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
    } else {
      console.error('No articles were found. Check the CSS selectors.');
    }
  } catch (error) {
    console.error('Error fetching articles:', error);
  }
};

cron.schedule('0 * * * *', fetchArticles); // Run every 15 seconds

app.get('/api/articles', async (req, res) => {
  try {
    const articles = await Article.find().sort({ published_date: -1 }).limit(5);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  fetchArticles(); // Initial scrape when server starts
});
