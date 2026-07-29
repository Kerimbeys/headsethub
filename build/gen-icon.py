from PIL import Image, ImageDraw

img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Draw a simple headphone-like shape
draw.ellipse([40, 20, 216, 160], fill='#00c8ff', outline='#00c8ff', width=12)
draw.rectangle([20, 100, 80, 220], fill='#00c8ff', outline='#00c8ff')
draw.rectangle([176, 100, 236, 220], fill='#00c8ff', outline='#00c8ff')
draw.ellipse([35, 95, 85, 225], fill='#0078d4')
draw.ellipse([171, 95, 221, 225], fill='#0078d4')

img.save('build/icon.ico', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
print('Icon created')
