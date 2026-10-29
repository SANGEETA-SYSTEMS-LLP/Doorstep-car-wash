import { Camera, ImagePlus } from "lucide-react";
import PhotoPreview from "./PhotoPreview";

function PhotoStage({
  title,
  description,
  photos,
  onChange,
  buttonText,
  buttonIcon,
  disabled,
  onContinue,
}) {
  return (
    <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-slate-200 bg-white p-7">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
          <Camera />
        </div>

        <h2 className="mt-4 text-2xl font-bold">
          {title}
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <label className="mt-7 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-9 text-center hover:border-green-400 hover:bg-green-50">
        <ImagePlus
          size={30}
          className="text-green-600"
        />

        <p className="mt-3 font-semibold">
          Add Photos
        </p>

        <p className="mt-1 text-xs text-slate-400">
          JPG, PNG or WEBP images
        </p>

        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={onChange}
          className="hidden"
        />
      </label>

      {photos.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <PhotoPreview
              key={`${photo.name}-${index}`}
              photo={photo}
            />
          ))}
        </div>
      )}

      <p className="mt-5 text-center text-sm text-slate-500">
        {photos.length} photo(s) selected
      </p>

      <button
        disabled={disabled}
        onClick={onContinue}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {buttonIcon}
        {buttonText}
      </button>
    </section>
  );
}

export default PhotoStage;
