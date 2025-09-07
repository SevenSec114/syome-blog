# 🛠️ Syome Blog
<p align="center">
  <a href="https://www.syome.top/" target="_blank">
    <img src="https://img.shields.io/badge/visit%20syome-view-88C0D0?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Website"/>
  </a>
</p>

This is my personal static blog built with [Astro](https://astro.build/). Mainly for notes, rambling, experiments, and occasional rants.

## ✨ Tech Stack

- **[Astro](https://astro.build/)** - Static site generator
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework

## 📦 Getting Started

To get this project up and running locally:

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

> [!NOTE]
> You should update the `.env` file just like `.env.template`. \
> For more info of `GITHUB_TOKEN`, you can follow [this guide](token-generate.md) (Please create a GitHub token with the `repo` scope to use all features).

## 📁 Project Structure

```
SyomeBlog/
├── src/
│   ├── components/        # Reusable components
│   ├── content/           # Markdown content (blog posts, etc.)
│   ├── custom/            # Custom contents (here you can add your own informations, contents, etc.)
│   ├── layouts/           # Page layouts
│   ├── pages/             # Page routes
│   ├── styles/            # Global styles
│   └── scripts/           # Global scripts
├── node_modules/          # Node.js dependencies
├── public/                # Static assets
├── astro.config.mjs       # Astro configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── package.json           # Project dependencies and scripts
└── README.md
```

## 🚀 Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the project for production
- `npm run preview` - Previews the built project locally
- `npm run astro` - Runs Astro CLI commands

## 🌐 Deployment to GitHub Pages

To deploy your blog to GitHub Pages, follow these steps:

1. Update `astro.config.mjs` with your GitHub username and repository name:
   ```js
   export default defineConfig({
     site: 'https://your-username.github.io',
     base: '/your-repo-name',
     // ... other config
   });
   ```

2. Build your project:
   ```bash
   npm run build
   ```

3. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

Make sure to replace `your-username` with your actual GitHub username and `your-repo-name` with your repository name.

## 🎨 Features

### Custom Contents
This blog template includes a custom section for adding custom contents to the blog. You can add your own information, contents, etc. in the `src/custom/` directory.

### Markdown Rendering

The blog uses a custom Markdown rendering system with the following features:

1. **Tailwind CSS Typography Plugin** - Provides beautiful default styles for all Markdown elements
2. **Enhanced Markdown Renderer Component** - Custom Astro component with additional styling options
3. **Custom Processor** - Built with the remark/rehype ecosystem for maximum control

## 🛠️ Post Guidelines

### Markdown Content

All blog posts and repos are written in Markdown and stored in `src/content/`. Each post should include frontmatter with:

- `title` - The post title
- `description` - A short description of the post
- `pubDate` - Publication date in YYYY-MM-DD format
- `tags` - Optional array of tags
- `language` - Reops' language usage for its post
- `repoUrl` - The github URL of the repo

> [!TIP]
> While typing fenced code block, keep the first line of the code block empty can `hide the copy button`

### Styling

Styling is done with Tailwind CSS. Custom styles should be added to component files or global styles in `src/styles/`.

### Components

Reusable components are located in `src/components/`. Each component should be self-contained and well-documented.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.