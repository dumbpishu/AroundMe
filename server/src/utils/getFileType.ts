export const getFileType = (mimetype: string) => {
  if (mimetype.startsWith("image")) return "image";
  if (mimetype.startsWith("audio")) return "audio";
  if (mimetype.startsWith("video")) return "video";
  return "text";
};