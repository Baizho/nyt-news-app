"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Link from "next/link";

interface Article {
  title: string;
  url: string;
  abstract: string;
  published_date: string;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    //nyt-news-app-phi.vercel.app/
    const socket = io("https://nyt-news-app-phi.vercel.app/");
    socket.on("connect", () => {
      console.log("connected");
    });
    socket.on("newArticle", (newArticle: Article[]) => {
      setArticles(newArticle);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <header className="bg-blue-600 text-white text-center py-5">
        <h1 className="text-3xl font-bold">
          New York Times 10 Technology World Articles
        </h1>
      </header>
      <main className="max-w-4xl mx-auto mt-10">
        {articles.length > 0 ? (
          articles.map((article, index) => (
            <Link
              href={article.url}
              key={index}
              className="bg-white p-5 shadow-md rounded-lg mb-5"
            >
              <h2 className="text-2xl font-semibold mb-2">{article.title}</h2>
              <p className="text-gray-700 mb-4">{article.abstract}</p>
              <p className="text-gray-500 mt-2">
                {new Date(article.published_date).toLocaleString()}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-center text-gray-500">No articles available</p>
        )}
      </main>
    </div>
  );
}
