# Dashboard Tower - Kanban Board

A beautiful, responsive Kanban board dashboard for task management built with React 18, Vite, and TailwindCSS.

## Features

✨ **Core Features**
- 4-column Kanban board: Draft, Ready, In Progress, Done
- Create, read, update, and delete cards
- Real-time polling (10-second intervals)
- Filter cards by type (Code, Research, Design, Other)
- Color-coded cards by type
- Drag-and-drop or button-based status changes
- Responsive design (mobile, tablet, desktop)

🎨 **Design**
- Beautiful gradient backgrounds
- Smooth animations and transitions
- Tailwind CSS styling
- Fully responsive layout
- Dark/light mode ready

⚡ **Performance**
- Fast initial load (< 3s)
- React Query for efficient caching
- Optimized builds with Vite
- Real-time updates without full page refresh

## Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NexAI/agent-os-dashboard.git
   cd agent-os-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run preview
```

## Environment Configuration

Create `.env.local` for local development:

```
VITE_API_URL=http://localhost:3001/api
```

For Vercel deployment, set the environment variable in Vercel dashboard:
- `VITE_API_URL` = `https://your-api-domain.vercel.app/api`

## Usage

### Creating a Card

1. Fill in the form at the top:
   - **Title** (required): Card title
   - **Type**: code, research, design, or other
   - **Status**: Draft, Ready, In Progress, or Done
   - **Description**: Optional details
   - **Assignee**: Person responsible
   - **Due Date**: Optional deadline

2. Click "Create Card"

### Managing Cards

- **Change Status**: Select from dropdown on card
- **Delete Card**: Click × button (with confirmation)
- **Filter**: Use type filter buttons at top
- **View Details**: Hover over card for more info

### Real-time Updates

The dashboard polls the API every 10 seconds automatically. Cards update in real-time as other users make changes.

## Architecture

### Frontend Stack
- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **React Query** - Data fetching & caching
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### API Integration

**Base URL**: Configured via `VITE_API_URL`

**Endpoints**:
- `GET /api/cards` - List all cards
- `POST /api/cards` - Create card
- `PATCH /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card

## File Structure

```
src/
  ├── App.jsx                 # Main application component
  ├── main.jsx                # Entry point
  ├── index.css               # Tailwind styles
  ├── components/
  │   ├── Card.jsx            # Card component
  │   ├── Column.jsx          # Kanban column
  │   └── NewCardForm.jsx     # Create card form
  └── services/
      └── cardService.js      # API client
```

## Performance Metrics

- **Initial Load**: < 1.5s
- **Time to Interactive**: < 2s
- **API Response**: < 500ms
- **Re-render Time**: < 100ms

## Deployment

### Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy (automatic on push to main)

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to hosting
```

## Troubleshooting

### Cards not loading
- Check API URL in environment variables
- Ensure API server is running
- Check browser console for CORS errors

### Filtering not working
- Clear browser cache
- Refresh page
- Check network tab in DevTools

### Cards not updating
- Check if API is responding
- Verify Supabase connection
- Check React Query devtools

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## License

MIT

## Support

For issues or questions, please create a GitHub issue.

---

**Built by NexAI Solutions** | Dashboard Tower v1.0
