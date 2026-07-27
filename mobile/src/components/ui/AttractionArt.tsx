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
 * foto, para as fichas nunca ficarem vazias.
 */
export function AttractionArt({ attraction, size }: AttractionArtProps) {
  if (attraction.hasImage) {
    return (
      <img
        src={attractionImageUrl(attraction.id)}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return <CategoryScene category={attraction.category} size={size} />;
}
