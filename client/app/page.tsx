"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

interface Article {
  title: string;
  url: string;
  abstract: string;
  published_date: string;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);

  const fetchArticles = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/articles");
      console.log(response);
      setArticles(response.data);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  useEffect(() => {
    fetchArticles();

    const socket = io("http://localhost:5000/api/articles");
    socket.on("newArticle", (newArticle: Article) => {
      setArticles([newArticle]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <header className="bg-blue-600 text-white text-center py-5">
        <h1 className="text-3xl font-bold">New York Times 10 World Articles</h1>
      </header>
      <main className="max-w-4xl mx-auto mt-10">
        <div className="text-center mb-4"></div>
        {articles.length > 0 ? (
          articles.map((article, index) => (
            <div key={index} className="bg-white p-5 shadow-md rounded-lg mb-5">
              <h2 className="text-2xl font-semibold mb-2">{article.title}</h2>
              <p className="text-gray-700 mb-4">{article.abstract}</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Read more
              </a>
              <p className="text-gray-500 mt-2">
                {new Date(article.published_date).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No articles available</p>
        )}
      </main>
    </div>
  );
}
