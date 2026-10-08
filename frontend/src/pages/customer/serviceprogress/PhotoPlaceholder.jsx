import { Image } from "lucide-react";

function PhotoPlaceholder({ text }) {
  return (
    <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      <Image size={20} />

      <p className="mt-2 text-xs">
        {text}
      </p>
    </div>
  );
}

export default PhotoPlaceholder;
