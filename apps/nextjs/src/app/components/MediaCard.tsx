/* eslint-disable @next/next/no-img-element */
import type { SimplifiedPlaylist, Track } from "@spotify/web-api-ts-sdk";

interface MediaCardProps {
  item: Track | SimplifiedPlaylist;
  onClick?: () => void;
}

const MediaCard = ({ item, onClick }: MediaCardProps) => {
  const isTrack = "artists" in item;
  const imageUrl = isTrack ? item.album.images[0]?.url : item.images[0]?.url;
  const title = item.name;
  const subtitle = isTrack
    ? item.artists.map((artist) => artist.name).join(", ")
    : undefined;

  return (
    <button
      className="flex h-64 w-48 flex-col justify-start space-y-2 border p-2 hover:scale-105"
      onClick={onClick}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          width={190}
          height={180}
          alt={title}
          className="aspect-square overflow-hidden object-cover"
        />
      )}
      <div className="space-y-1 text-left">
        <p className="line-clamp-2 text-sm">{title}</p>
        {subtitle && (
          <p className="line-clamp-1 text-xs opacity-80">{subtitle}</p>
        )}
      </div>
    </button>
  );
};

export default MediaCard;
