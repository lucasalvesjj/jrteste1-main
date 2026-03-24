import { useEffect, useRef, useCallback } from "react";

/* ─── Logos inline como SVG data-URI ────────────────────────────────
   Embutidos no bundle JS — funcionam em qualquer ambiente sem
   depender de arquivos estáticos externos.
─────────────────────────────────────────────────────────────────── */
const LOGO_MAP: Record<string, string> = {
  stihl:          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 64"><rect width="180" height="64" rx="6" fill="#F37A1F"/><text x="90" y="44" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="34" fill="white" text-anchor="middle" letter-spacing="3">STIHL</text></svg>`,
  dewalt:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 64"><rect width="200" height="64" rx="6" fill="#FEBD17"/><text x="100" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="28" fill="#111" text-anchor="middle">DeWALT</text><rect x="0" y="52" width="200" height="8" fill="#111"/></svg>`,
  bosch:          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 64"><rect width="200" height="64" rx="6" fill="#003979"/><text x="100" y="44" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="30" fill="white" text-anchor="middle" letter-spacing="2">BOSCH</text></svg>`,
  makita:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 64"><rect width="200" height="64" rx="6" fill="#003087"/><text x="100" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" fill="white" text-anchor="middle" letter-spacing="1">MAKITA</text></svg>`,
  "black+decker": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 64"><rect width="230" height="64" rx="6" fill="#F26522"/><text x="115" y="41" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="20" fill="white" text-anchor="middle" letter-spacing="1">BLACK+DECKER</text></svg>`,
  stanley:        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 64"><rect width="200" height="64" rx="6" fill="#003087"/><text x="100" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" fill="#F7E200" text-anchor="middle" letter-spacing="2">STANLEY</text></svg>`,
  weg:            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 64"><rect width="160" height="64" rx="6" fill="#00539B"/><text x="80" y="44" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="34" fill="white" text-anchor="middle" letter-spacing="2">WEG</text></svg>`,
  schneider:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 64"><rect width="210" height="64" rx="6" fill="#3DCD58"/><text x="105" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="24" fill="white" text-anchor="middle" letter-spacing="1">SCHNEIDER</text></svg>`,
  lepono:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 64"><rect width="190" height="64" rx="6" fill="#E30613"/><text x="95" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" fill="white" text-anchor="middle" letter-spacing="1">LEPONO</text></svg>`,
  anauger:        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 64"><rect width="200" height="64" rx="6" fill="#1A237E"/><text x="100" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="24" fill="white" text-anchor="middle" letter-spacing="1">ANAUGER</text></svg>`,
  eletroplas:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 64"><rect width="220" height="64" rx="6" fill="#0057A8"/><text x="110" y="42" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="22" fill="white" text-anchor="middle" letter-spacing="1">ELETROPLAS</text></svg>`,
  tigre:          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 64"><rect width="180" height="64" rx="6" fill="#E30613"/><text x="90" y="44" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="30" fill="white" text-anchor="middle" letter-spacing="2">TIGRE</text></svg>`,
  amanco:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 64"><rect width="200" height="64" rx="6" fill="#006341"/><text x="100" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" fill="white" text-anchor="middle" letter-spacing="1">AMANCO</text></svg>`,
  hunter:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 64"><rect width="190" height="64" rx="6" fill="#CC0000"/><text x="95" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" fill="white" text-anchor="middle" letter-spacing="1">HUNTER</text></svg>`,
  bermad:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 64"><rect width="190" height="64" rx="6" fill="#004B87"/><text x="95" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" fill="white" text-anchor="middle" letter-spacing="1">BERMAD</text></svg>`,
  senninger:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 64"><rect width="220" height="64" rx="6" fill="#005F9E"/><text x="110" y="42" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="22" fill="white" text-anchor="middle" letter-spacing="1">SENNINGER</text></svg>`,
  spezzia:        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 64"><rect width="190" height="64" rx="6" fill="#1B4F8A"/><text x="95" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="25" fill="white" text-anchor="middle" letter-spacing="1">SPEZZIA</text></svg>`,
  viqua:          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 64"><rect width="170" height="64" rx="6" fill="#006DB6"/><text x="85" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="28" fill="white" text-anchor="middle" letter-spacing="1">VIQUA</text></svg>`,
  durin:          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 64"><rect width="160" height="64" rx="6" fill="#2E7D32"/><text x="80" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="29" fill="white" text-anchor="middle" letter-spacing="1">DURIN</text></svg>`,
  rsb:            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 64"><rect width="140" height="64" rx="6" fill="#B71C1C"/><text x="70" y="44" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="34" fill="white" text-anchor="middle" letter-spacing="3">RSB</text></svg>`,
  gedore:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 64"><rect width="190" height="64" rx="6" fill="#1A237E"/><text x="95" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" fill="white" text-anchor="middle" letter-spacing="1">GEDORE</text></svg>`,
  "gedore red":   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 64"><rect width="210" height="64" rx="6" fill="#C62828"/><text x="105" y="42" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="22" fill="white" text-anchor="middle" letter-spacing="1">GEDORE RED</text></svg>`,
  foxlux:         `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 64"><rect width="190" height="64" rx="6" fill="#E65100"/><text x="95" y="43" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="27" fill="white" text-anchor="middle" letter-spacing="1">FOXLUX</text></svg>`,
  carbografite:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64"><rect width="240" height="64" rx="6" fill="#212121"/><text x="120" y="42" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="20" fill="white" text-anchor="middle" letter-spacing="1">CARBOGRAFITE</text></svg>`,
  mtx:            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 64"><rect width="150" height="64" rx="6" fill="#1565C0"/><text x="75" y="44" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="34" fill="white" text-anchor="middle" letter-spacing="3">MTX</text></svg>`,
  apex:           `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 64"><rect width="160" height="64" rx="6" fill="#283593"/><text x="80" y="44" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="30" fill="white" text-anchor="middle" letter-spacing="2">APEX</text></svg>`,
};

const toDataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/* ─── Componente de cada logo individual ──────────────────────── */
const BrandLogo = ({ name }: { name: string }) => {
  const svg = LOGO_MAP[name.toLowerCase()];
  if (svg) {
    return (
      <img
        src={toDataUri(svg)}
        alt={name}
        draggable={false}
        style={{ height: 40, width: "auto", maxWidth: 180, objectFit: "contain", display: "block" }}
      />
    );
  }
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6,
        padding: "4px 12px", whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  );
};

/* ─── BrandSlider — carrossel horizontal infinito via JS ─────── */
interface Brand { name: string; logo?: string; }
interface BrandSliderProps { brands: Brand[]; title?: string; }

const SPEED = 0.3; // pixels por frame (~18 px/s a 60 fps)
const GAP = 48;    // espaçamento entre logos em px

const BrandSlider = ({ brands, title = "Marcas que trabalhamos" }: BrandSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);

  // Duplica marcas para preencher o loop
  const items = [...brands, ...brands];

  const tick = useCallback(() => {
    const track = trackRef.current;
    if (track && !pausedRef.current) {
      offsetRef.current -= SPEED;
      // Largura de 1 conjunto (metade do track, já que duplicamos)
      const halfWidth = track.scrollWidth / 2;
      if (Math.abs(offsetRef.current) >= halfWidth) {
        offsetRef.current += halfWidth;
      }
      track.style.transform = `translateX(${offsetRef.current}px)`;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  return (
    <div style={{ marginTop: 40 }}>
      {title && (
        <h3
          style={{
            marginBottom: 20, textAlign: "center",
            fontFamily: "var(--font-heading)", fontSize: 18,
            fontWeight: 700, color: "hsl(var(--foreground))",
          }}
        >
          {title}
        </h3>
      )}

      {/* Container com overflow hidden */}
      <div
        style={{
          overflow: "hidden", position: "relative",
          borderRadius: 12, border: "1px solid hsl(var(--border))",
          background: "hsl(var(--background))",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "24px 0",
        }}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {/* Fade esquerdo */}
        <div
          style={{
            position: "absolute", top: 0, bottom: 0, left: 0,
            width: 80, zIndex: 2, pointerEvents: "none",
            background: "linear-gradient(to right, hsl(var(--background)) 30%, transparent)",
          }}
        />
        {/* Fade direito */}
        <div
          style={{
            position: "absolute", top: 0, bottom: 0, right: 0,
            width: 80, zIndex: 2, pointerEvents: "none",
            background: "linear-gradient(to left, hsl(var(--background)) 30%, transparent)",
          }}
        />

        {/* Track — 1 linha horizontal, movida via JS transform */}
        <div
          ref={trackRef}
          style={{
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "center",
            gap: GAP,
            width: "max-content",
            willChange: "transform",
          }}
        >
          {items.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              style={{
                display: "inline-flex", alignItems: "center",
                justifyContent: "center", height: 48, flexShrink: 0,
              }}
            >
              <BrandLogo name={brand.name} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandSlider;
