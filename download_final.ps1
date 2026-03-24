$outDir = "C:\Users\lucas\Downloads\jr1-main 2203\jrteste1-main\public\images"

# Irrigacao Agricola - irrigacao por aspersao em lavoura
# Pexels photo by Tom Fisk - agricultural irrigation
$irrigacao = "https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=800"

# Bombas e Motores - bomba/motor industrial  
# Pexels photo - industrial pump/motor equipment
$bombas = "https://images.pexels.com/photos/3846205/pexels-photo-3846205.jpeg?auto=compress&cs=tinysrgb&w=800"

# STIHL Assistencia - motosserra/trabalho florestal
# Pexels photo - chainsaw cutting wood
$stihl = "https://images.pexels.com/photos/6508357/pexels-photo-6508357.jpeg?auto=compress&cs=tinysrgb&w=800"

# Pocos Artesianos - poco de agua/bomba submersa
# Pexels photo - water well drilling
$pocos = "https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=800"

$downloads = @(
    @("seg-irrigacao.jpg", $irrigacao),
    @("seg-bombas.jpg", $bombas),
    @("seg-stihl.jpg", $stihl),
    @("seg-pocos.jpg", $pocos)
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