$outDir = "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main\public\images"

# Irrigacao Agricola - foto de irrigacao por aspersao em campo agricola (Ivan Bandura)
$url1 = "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=800&q=80"

# Bombas e Motores - bomba d'agua / motor industrial (Crystal Kwok - industrial pipes/pumps)
$url2 = "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80"

# STIHL Assistencia Tecnica - pessoa usando motosserra / trabalho florestal (Markus Spiske)
$url3 = "https://images.unsplash.com/photo-1598618356794-eb1720430eb4?w=800&q=80"

# Pocos Artesianos - bomba de agua subterranea / poco (Amritanshu Sikdar - water well)
$url4 = "https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=800&q=80"

$downloads = @(
    @("seg-irrigacao.jpg", $url1),
    @("seg-bombas.jpg", $url2),
    @("seg-stihl.jpg", $url3),
    @("seg-pocos.jpg", $url4)
)

foreach ($item in $downloads) {
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