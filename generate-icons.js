
const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 32, 57, 60, 72, 76, 96, 114, 120, 144, 152, 180, 192, 512];
const iconPath = 'icons/icon.svg';

sizes.forEach(size => {
  const outputPath = `icons/icon-${size}x${size}.png`;
  sharp(iconPath)
    .resize(size, size)
    .toFile(outputPath, (err, info) => {
      if (err) {
        console.error(`Error generating icon-${size}x${size}.png:`, err);
      } else {
        console.log(`Generated icon-${size}x${size}.png`);
      }
    });
});
