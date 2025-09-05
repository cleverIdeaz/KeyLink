# KeyLink Presentation

Interactive presentation page for KeyLink framework with donation system and usage caps.

## Features

- **Interactive Slides**: 6 slides covering KeyLink's story, problem, solution, demo, vision, and support
- **Donation System**: PayPal integration with goal tracking ($7/month)
- **Usage Caps**: Prevents exceeding hosting costs with automatic shutdown
- **Circle of Fifths**: Interactive music theory visualization
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Keyboard Navigation**: Arrow keys for slide navigation

## Setup

1. **Deploy to your subdomain** (e.g., `presentation.keylink.com`)
2. **Update PayPal integration** in `script.js`:
   ```javascript
   // Replace with your actual PayPal donation link
   processDonation() {
       const amount = parseFloat(document.getElementById('customAmount').value);
       // Redirect to your PayPal donation page
       window.open(`https://www.paypal.com/donate?amount=${amount}&business=your-paypal-email@example.com`, '_blank');
   }
   ```

3. **Configure usage monitoring** in `script.js`:
   ```javascript
   // Set your actual usage limits
   this.usageLimit = 1000; // Adjust based on your Fly.io plan
   ```

## Usage

- **Navigation**: Use arrow keys, navigation buttons, or click slide indicators
- **Demo**: Click on the Circle of Fifths to see real-time sync simulation
- **Donations**: Click any donate button to open the donation modal
- **Info**: Click "Why Donations?" to learn about the project's funding needs

## Customization

### Colors
Update the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #4CAF50;
    --warning-color: #e74c3c;
}
```

### Content
Edit slide content in `index.html`:
- Update hero section with your messaging
- Modify problem/solution descriptions
- Add your contact information
- Update community links

### Donation Goal
Change the monthly goal in `script.js`:
```javascript
this.monthlyGoal = 7; // Your monthly hosting cost
```

## Technical Details

- **Pure HTML/CSS/JavaScript**: No external dependencies except Font Awesome
- **Local Storage**: Saves donation progress locally
- **Responsive**: Mobile-first design with breakpoints
- **Accessibility**: Keyboard navigation and screen reader friendly
- **Performance**: Optimized animations and minimal JavaScript

## Integration with KeyLink

This presentation is designed to work alongside your main KeyLink application:
- Links to `https://key-link.netlify.app/` for the live demo
- Explains the technical architecture
- Shows the community development goals
- Provides clear donation messaging

## Support

For questions about this presentation or KeyLink development:
- **Email**: neal@styletree.me
- **GitHub**: https://github.com/cleverIdeaz/KeyLink
- **Team**: https://phewsh.com
