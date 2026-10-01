"use client";

import Image from "next/image";
import { useState } from "react";
import { posterUrl } from "@/lib/types";

// Shows the poster, or a lettered placeholder if there isn't one or it fails to load.
export function Poster({ title, path }: { title: string; path: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = posterUrl(path);

  return (
    <div className="poster">
      {src && !failed ? (
        <Image
          src={src}
          alt={`Poster for ${title}`}
          width={342}
          height={513}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="poster-fallback" role="img" aria-label={`No poster available for ${title}`}>
          {title.slice(0, 1)}
        </div>
      )}
    </div>
  );
}
