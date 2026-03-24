import { motion } from "framer-motion";

interface JRLoaderProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeConfig = {
  sm: { container: "min-h-[120px]", logo: "h-10 w-10", ring: 28, stroke: 2, text: "text-xs", gap: "gap-2" },
  md: { container: "min-h-[40vh]", logo: "h-16 w-16", ring: 44, stroke: 2.5, text: "text-sm", gap: "gap-3" },
  lg: { container: "min-h-[60vh]", logo: "h-20 w-20", ring: 56, stroke: 3, text: "text-sm", gap: "gap-4" },
};

const JRLoader = ({ size = "lg", label = "Carregando..." }: JRLoaderProps) => {
  const cfg = sizeConfig[size];
  const r = cfg.ring;
  const svgSize = r * 2 + 20;
  const circumference = 2 * Math.PI * r;

  return (
    <div className={`flex ${cfg.container} items-center justify-center px-4`}>
      <div className={`flex flex-col items-center ${cfg.gap}`}>
        {/* Container do logo + anel orbital */}
        <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
          {/* Anel de brilho pulsante (fundo) */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Arco orbital SVG */}
          <svg
            className="absolute inset-0"
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
          >
            {/* Trilha sutil */}
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={r}
              fill="none"
              stroke="hsl(var(--primary) / 0.08)"
              strokeWidth={cfg.stroke}
            />
          </svg>

          {/* Arco animado que orbita */}
          <motion.svg
            className="absolute inset-0"
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <defs>
              <linearGradient id={`arc-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={r}
              fill="none"
              stroke={`url(#arc-grad-${size})`}
              strokeWidth={cfg.stroke}
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.3} ${circumference * 0.7}`}
            />
          </motion.svg>

          {/* Logo com efeito de rotação 3D (moeda) + shimmer */}
          <div className="relative z-10 overflow-hidden rounded-full">
            <motion.img
              src="/favicon.webp"
              alt="Comercial JR"
              className={`${cfg.logo} rounded-full object-contain drop-shadow-lg`}
              animate={{
                rotateY: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformStyle: "preserve-3d" }}
            />

            {/* Shimmer / reflexo metálico */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>

        {/* Texto com fade pulsante */}
        <motion.span
          className={`${cfg.text} font-body font-medium text-muted-foreground`}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.span>
      </div>
    </div>
  );
};

export default JRLoader;
