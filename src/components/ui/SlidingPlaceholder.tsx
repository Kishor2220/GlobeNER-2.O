import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

const placeholders = [
  { text: "Enter text for intelligence extraction", lang: "English" },
  { text: "ಮಾಹಿತಿ ವಿಶ್ಲೇಷಣೆಗೆ ಪಠ್ಯವನ್ನು ನಮೂದಿಸಿ", lang: "Kannada" },
  { text: "विश्लेषण के लिए पाठ दर्ज करें", lang: "Hindi" },
  { text: "பகுப்பாய்விற்காக உரையை உள்ளிடவும்", lang: "Tamil" },
  { text: "విశ్లేషణ కోసం పాఠ్యాన్ని నమోదు చేయండి", lang: "Telugu" },
  { text: "أدخل النص للتحليل", lang: "Arabic" },
  { text: "输入文本进行分析", lang: "Chinese" },
  { text: "Ingrese texto para análisis", lang: "Spanish" },
  { text: "Entrez le texte pour analyse", lang: "French" },
];

interface SlidingPlaceholderProps {
  inputValue: string;
}

export function SlidingPlaceholder({ inputValue }: SlidingPlaceholderProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (inputValue.length > 0) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [inputValue]);

  if (inputValue.length > 0) return null;

  return (
    <div className="absolute left-8 top-8 pointer-events-none select-none overflow-hidden h-8 flex items-center z-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex items-center gap-3"
        >
          <span className="text-lg text-zinc-600 font-medium leading-relaxed">
            {placeholders[index].text}
          </span>
          <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest bg-zinc-900/50 px-2 py-0.5 rounded border border-white/5">
            {placeholders[index].lang}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
