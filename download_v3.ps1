$outDir = "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main\public\images"

# Bombas e Motores - alternativas melhores
$bombasUrls = @(
    @("seg-bombas-alt1.jpg", "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80"),
    @("seg-bombas-alt2.jpg", "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80"),
    @("seg-bombas-alt3.jpg", "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80")
)

# Pocos Artesianos - alternativas melhores  
$pocosUrls = @(
    @("seg-pocos-alt1.jpg", "https://images.unsplash.com/photo-1468956398224-6d6f66e22c35?w=800&q=80"),
    @("seg-pocos-alt2.jpg", "https://images.unsplash.com/photo-1519455953755-af066f52f1a6?w=800&q=80"),
    @("seg-pocos-alt3.jpg", "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80")
)

$all = $bombasUrls + $pocosUrls

foreach ($item in $all) {
    $name = $item[0]
    $url = $item[1]
    $outPath = Join-Path $outDir $name
    Write-Host "Downloading $name..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $outPath -UseBasicParsing
        $size = (Get-Item $outPath).Length
        Write-Host "  OK: $size bytes"
    } catch {
        Write-Host "  FAIL: $($_.Exception.Message)"
    }
}
Write-Host "ALL DONE"