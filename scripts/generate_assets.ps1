Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "assets\icon_dark.png"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

# Ensure output directories exist
New-Item -ItemType Directory -Force -Path "extension\icons" | Out-Null
New-Item -ItemType Directory -Force -Path "installer" | Out-Null

function Resize-Image($src, $w, $h) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    return $bmp
}

# 1. Generate Extension Icons
$sizes = @(16, 32, 48, 128)
foreach ($s in $sizes) {
    $outBmp = Resize-Image $srcImg $s $s
    $outBmp.Save("extension\icons\icon$s.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
    Write-Host "Created extension\icons\icon$s.png"
}

# 2. Generate 256px png for installer icon base
$bmp256 = Resize-Image $srcImg 256 256
$bmp256.Save("installer\icon256.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 3. Generate Windows .ICO with proper ICO headers
# Writing a multi-res or single 256/48/32/16 ICO file
$icoStream = [System.IO.File]::Create("installer\app_icon.ico")
$icoWriter = New-Object System.IO.BinaryWriter $icoStream

$icoSizes = @(256, 128, 64, 48, 32, 16)
# ICONDIR header: Reserved (0), Type (1 for ICO), ImageCount
$icoWriter.Write([uint16]0)
$icoWriter.Write([uint16]1)
$icoWriter.Write([uint16]$icoSizes.Count)

$pngBytesList = @()
foreach ($sz in $icoSizes) {
    $bmp = Resize-Image $srcImg $sz $sz
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytesList += ,$ms.ToArray()
    $ms.Dispose()
    $bmp.Dispose()
}

$offset = 6 + ($icoSizes.Count * 16)
for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $sz = $icoSizes[$i]
    $bytes = $pngBytesList[$i]
    $bWidth = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $bHeight = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    
    $icoWriter.Write($bWidth)             # Width
    $icoWriter.Write($bHeight)            # Height
    $icoWriter.Write([byte]0)             # Color count (0 for 256+)
    $icoWriter.Write([byte]0)             # Reserved
    $icoWriter.Write([uint16]1)           # Color planes
    $icoWriter.Write([uint16]32)          # Bits per pixel
    $icoWriter.Write([uint32]$bytes.Length)# Bytes in image
    $icoWriter.Write([uint32]$offset)     # Offset of image data
    
    $offset += $bytes.Length
}

for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $icoWriter.Write($pngBytesList[$i])
}

$icoWriter.Flush()
$icoStream.Close()
Write-Host "Created installer\app_icon.ico"

# 4. Generate Inno Setup Wizard BMP (164 x 314 px)
# Dark luxury gradient with branding and centered icon
$wizBmp = New-Object System.Drawing.Bitmap 164, 314
$gWiz = [System.Drawing.Graphics]::FromImage($wizBmp)
$rectWiz = New-Object System.Drawing.Rectangle 0, 0, 164, 314
$gradWiz = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rectWiz, ([System.Drawing.Color]::FromArgb(255, 12, 16, 28)), ([System.Drawing.Color]::FromArgb(255, 5, 6, 12)), 90
$gWiz.FillRectangle($gradWiz, $rectWiz)
$gradWiz.Dispose()

# Draw circular glowing badge for icon
$badgeSize = 100
$badgeX = (164 - $badgeSize) / 2
$badgeY = 55
$gWiz.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gWiz.DrawImage($srcImg, $badgeX, $badgeY, $badgeSize, $badgeSize)

# Draw Title and Subtitle text on banner
$fontTitle = [System.Drawing.Font]::new("Segoe UI", [single]11, [System.Drawing.FontStyle]::Bold)
$brushTitle = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 240, 243, 246))
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$gWiz.DrawString("GOM COLOR PICKER", $fontTitle, $brushTitle, 82, 175, $sf)

$fontSub = [System.Drawing.Font]::new("Segoe UI", [single]8, [System.Drawing.FontStyle]::Bold)
$brushSub = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
$gWiz.DrawString("PRO ART SUITE", $fontSub, $brushSub, 82, 198, $sf)

$fontTag = [System.Drawing.Font]::new("Segoe UI", [single]7, [System.Drawing.FontStyle]::Regular)
$brushTag = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
$gWiz.DrawString("Photoshop • Web • 4D", $fontTag, $brushTag, 82, 222, $sf)

$fontVer = [System.Drawing.Font]::new("Segoe UI", [single]7, [System.Drawing.FontStyle]::Italic)
$brushVer = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 100, 116, 139))
$gWiz.DrawString("v4.0 Definitiva", $fontVer, $brushVer, 82, 285, $sf)

$gWiz.Dispose()
$wizBmp.Save("installer\wizard_image.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
$wizBmp.Dispose()
Write-Host "Created installer\wizard_image.bmp"

# 5. Generate Inno Setup Header Small BMP (55 x 58 px)
$smallBmp = New-Object System.Drawing.Bitmap 55, 58
$gSmall = [System.Drawing.Graphics]::FromImage($smallBmp)
$rectSmall = New-Object System.Drawing.Rectangle 0, 0, 55, 58
$brushBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 18, 22, 34))
$gSmall.FillRectangle($brushBg, $rectSmall)
$brushBg.Dispose()
$gSmall.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gSmall.DrawImage($srcImg, 6, 7, 44, 44)
$gSmall.Dispose()
$smallBmp.Save("installer\wizard_small.bmp", [System.Drawing.Imaging.ImageFormat]::Bmp)
$smallBmp.Dispose()
Write-Host "Created installer\wizard_small.bmp"

$srcImg.Dispose()
Write-Host "All assets generated successfully!"
