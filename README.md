# Notes App

A full-stack, serverless note-taking application built with **React**, **TypeScript**, **Express.js**, and **Prisma**, designed for a personalized note-taking experience **without requiring authentication**.

**Live Demo:** [https://frontendnotes-seven.vercel.app/](https://frontendnotes-seven.vercel.app/)

---

## Features

- **Serverless REST API:** Built with Express.js and Prisma ORM to manage CRUD operations for a PostgreSQL database (hosted on Supabase). Optimized connection pooling and indexed queries support an anonymous user identification system.
- **React Frontend:** TypeScript-based frontend with dynamic API calls, real-time state management, and `localStorage` persistence for notes.
- **Personalized Notes:** Users can take notes without creating an account, with all data saved per session.
- **Cloud Deployment:** Full-stack deployment on Vercel with proper cache headers, CORS policies, and stable database connection parameters.

---

## Tech Stack

- **Frontend:** React, TypeScript
- **Backend:** Express.js, Prisma ORM, PostgreSQL (Supabase)  
- **Deployment:** Vercel
