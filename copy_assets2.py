import shutil, os

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

src_fav = r"C:\Users\lucas\Downloads\Comercial JR favicon .png"
src_logo = r"C:\Users\lucas\Downloads\comercial JR logo.webp"
dest = r"C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main\public"

shutil.copy(src_logo, os.path.join(dest, "logo.webp"))
print("Logo copiada!")

if HAS_PIL:
    img = Image.open(src_fav)
    img.save(os.path.join(dest, "favicon.webp"), "WEBP", quality=95)
    print("Favicon convertido para WebP!")
else:
    shutil.copy(src_fav, os.path.join(dest, "favicon.webp"))
    print("Favicon copiado (sem conversao PIL)!")

print("Pronto!")
