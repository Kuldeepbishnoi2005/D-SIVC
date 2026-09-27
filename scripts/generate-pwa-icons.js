const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const psScript = `
Add-Type -AssemblyName System.Drawing
$src = '${path.join(__dirname, '..', 'assets', 'images', 'icon.png').replace(/\\/g, '\\\\')}'
$img = [System.Drawing.Bitmap]::FromFile($src)

function Resize-Img($w, $h, $out) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $out"
}

Resize-Img 192 192 '${path.join(publicDir, 'icon-192.png').replace(/\\/g, '\\\\')}'
Resize-Img 512 512 '${path.join(publicDir, 'icon-512.png').replace(/\\/g, '\\\\')}'
Resize-Img 512 512 '${path.join(publicDir, 'icon-maskable-512.png').replace(/\\/g, '\\\\')}'
Resize-Img 180 180 '${path.join(publicDir, 'apple-touch-icon.png').replace(/\\/g, '\\\\')}'
Resize-Img 32 32 '${path.join(publicDir, 'favicon-32x32.png').replace(/\\/g, '\\\\')}'

$img.Dispose()
`;

fs.writeFileSync(path.join(__dirname, 'gen.ps1'), psScript);
try {
  execSync('powershell -ExecutionPolicy Bypass -File "' + path.join(__dirname, 'gen.ps1') + '"', { stdio: 'inherit' });
  console.log('Icons generated successfully in public/');
} finally {
  if (fs.existsSync(path.join(__dirname, 'gen.ps1'))) {
    fs.unlinkSync(path.join(__dirname, 'gen.ps1'));
  }
}
