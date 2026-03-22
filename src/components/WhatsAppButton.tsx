import { MessageCircle } from "lucide-react";
import { company } from "@/data/company";

const WhatsAppButton = () => {
  const url = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent("Olá! Gostaria de mais informações sobre os produtos da Comercial JR.")}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 rounded-full bg-brand-green p-4 text-primary-foreground shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-brand-green/30"
      aria-label="Fale conosco pelo WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};

export default WhatsAppButton;
