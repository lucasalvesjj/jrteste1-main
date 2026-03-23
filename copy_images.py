import base64, os

dest = r"C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main\public"

# Favicon WebP (convertido de PNG)
fav_b64 = (
    "UklGRlgjAABXRUJQVlA4IEwjAAAQYgCdASqWAJYAPhkKg0EhBY8TnwQAYSxgGk3GK5Psl5dI"
    "ZagPmvyHwadW+Xp0l/x/7X7Pv9b6zv1B6JH+k9KT2O+bz9nP+H/oPeW/1XsD83rqw/Rm8sH"
    "9vvii/aP9kPiA/arBj+Of5fwP8OXn/2J/uX/a/1PySf1HfM6T/3foJ/KPth95/xH7Jf3b/z/"
    "8X5w/2/5M+gvyj/pfyV/LH7FPxD+Zf27+2fsH/cP/F/wOXg2T/If6j8xvgR9Wfmn9w/uv7Q/"
    "4/9vPqE+n/1Xp59lf9d+W/0Bfx7+af3L+w/sr/dP/P9bf67/jePb9q/xv++9wH+R/0r/Jf3f"
    "/Lf8n/Jf/X7Y/47/e/5//J/7//R///3y/oH9x/0n+E/z3+//w//7/736D/x7+bf3X+0f5D/a/"
)

logo_b64 = (
    "UklGRm4SAABXRUJQVlA4WAoAAAAQAAAAxQEAMAAAQUxQSBcLAAABr6GgjaSIZzLgX/GAioj5"
    "z3HBW4IgXMKiB11IoUNQUEgQFNKi8OFt27YtybZtm1HLF9R8f8t3M01TUJn//19jXYF5BYZ9"
    "34/O4fwS0f+Esxo+/8Et/J37/Adf8Ie+8h/cwx/6c/3PXeL/Xxr/2JaHv3SH/9hHFX/pFf+x"
    "O/ypA/5jffylO/zH/uBPveU/doS/dOXBf+qrir90n//YDf7U3/xHhhfTxl+6ErzyPekYfZTQ"
)

print("Favicon b64 length:", len(fav_b64))
print("Logo b64 length:", len(logo_b64))
print("NOTA: Os dados base64 acima sao incompletos - precisa do arquivo completo")
print("Arquivos em public:", os.listdir(dest))
