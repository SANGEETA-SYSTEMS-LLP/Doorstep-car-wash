
function PhotoPreview({ photo }) {
  const imageUrl =
    URL.createObjectURL(photo);

  return (
    <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
      <img
        src={imageUrl}
        alt={photo.name}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

export default PhotoPreview;
