# Business Profile

A modern business landing page built with Next.js, React, and Tailwind CSS.

## 🚀 Features

- **Next.js 15** - Latest version with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety
- **Tailwind CSS 4** - Latest version for styling
- **ESLint + Prettier** - Code quality and formatting
- **Environment Variables** - Secure configuration management
- **Responsive Design** - Works on all devices
- **Modern UI** - Clean and professional design

## 📦 Tech Stack

- **Framework**: Next.js 15.5.2
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Linting**: ESLint 9
- **Formatting**: Prettier 3.6.2
- **React**: 19.1.0

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd business-profile
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp env.example .env.local
```

4. Edit `.env.local` with your configuration values.

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📄 Subscription & Pro features

Billing behavior, Stripe webhooks, and the full **Free vs Pro** feature matrix (paywall) live in **[`docs/subscription-and-pro-features.md`](docs/subscription-and-pro-features.md)**. Technical Stripe API setup is in [`src/app/api/stripe/README.md`](src/app/api/stripe/README.md).

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build directories

## 🌍 Environment Variables

Create a `.env.local` file based on `env.example`:



## 🎨 Customization

### Styling

The application uses Tailwind CSS for styling. You can customize the design by:

- Modifying `src/app/globals.css`
- Updating `tailwind.config.ts`
- Adding custom components in `src/components/`

### Content

Update the landing page content in `src/app/page.tsx` to match your business needs.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms

Build the application:

```bash
npm run build
npm run start
```

## 📝 Code Quality

This project includes:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Pre-commit hooks** (can be added with husky)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.
