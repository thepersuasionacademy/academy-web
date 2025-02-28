# The Persuasion Academy Homepage

This is a standalone homepage designed to be embedded in the WordPress site at the root domain of The Persuasion Academy.

## Embedding Instructions

To embed this page in your WordPress site, follow these steps:

1. **Create a Full-Width Page in WordPress**
   - Create a new page in WordPress
   - Choose a full-width template (no header, footer, or sidebar)

2. **Add an HTML/Custom Code Block**
   - Add an HTML or Custom Code block to the page
   - Use the following iframe code:

```html
<iframe 
  src="https://app.thepersuasionacademy.com/public/home" 
  style="width: 100%; height: 100vh; border: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;" 
  title="The Persuasion Academy"
  allowfullscreen
></iframe>
```

3. **Publish the Page**
   - Set this page as your homepage in WordPress Settings > Reading

## Features

- **Responsive Design**: Adapts to all screen sizes
- **Luxury Feel**: Matches the design aesthetic of the auth login page
- **Path to Mastery**: Showcases the three main paths (Personal Mastery, Strategic Persuasion, High Ticket Sales)
- **No Authentication Required**: This page is publicly accessible

## Technical Details

- Built with Next.js
- Uses Framer Motion for animations
- Styled with Tailwind CSS
- Completely independent of authentication requirements 