const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes for the app
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate placeholder icons (you can replace these with actual icons)
const generateIcon = (size) => {
    const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" text-anchor="middle" dy="0.35em" fill="white">W</text>
  <text x="50%" y="70%" font-family="Arial, sans-serif" font-size="${size * 0.1}" text-anchor="middle" fill="white" opacity="0.8">TTS</text>
</svg>`;

    return svg;
};

// Generate icons
iconSizes.forEach(size => {
    const svg = generateIcon(size);
    // const filename = `icon-${size}x${size}.png`; // Future PNG generation

    // For now, we'll create SVG files instead of PNG
    // In a real project, you'd use a library like sharp to convert SVG to PNG
    const svgFilename = `icon-${size}x${size}.svg`;
    const svgFilepath = path.join(iconsDir, svgFilename);

    fs.writeFileSync(svgFilepath, svg);
    console.log(`Generated ${svgFilename}`);
});

// Create a simple favicon
const faviconSvg = generateIcon(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSvg);
console.log('App icons generated successfully!');
console.log('Note: These are SVG placeholders. For production, convert them to PNG format.');
