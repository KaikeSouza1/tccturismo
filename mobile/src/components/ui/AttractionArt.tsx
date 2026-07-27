import { useState } from "react";
import { attractionImageUrl } from "../../lib/api";
import { CategoryScene } from "../../icons/scenes";
import type { Attraction } from "../../types";

interface AttractionArtProps {
  attraction: Pick<Attraction, "id" | "hasImage" | "category">;
  size: number;
}

/**
 * Mostra a foto real do atrativo quando a organizacao cadastrou uma (via
 * painel admin); cai para a ilustracao de categoria quando ainda nao ha
 * foto, para as fichas nunca ficarem vazias. Tambem cai para a ilustracao
 * se a foto real falhar ao carregar (ex: timeout do proxy de imagem em
 * cold start serverless) em vez de deixar o icone de imagem quebrada.
 */
export function AttractionArt({ attraction, size }: AttractionArtProps) {
  const [failed, setFailed] = useState(false);

  if (attraction.hasImage && !failed) {
    return (
      <img
        src={attractionImageUrl(attraction.id)}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={() => setFailed(true)}
      />
    );
  }
  return <CategoryScene category={attraction.category} size={size} />;
}
