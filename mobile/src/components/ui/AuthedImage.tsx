import { useEffect, useState, type CSSProperties } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiUrl } from "../../lib/api";

interface AuthedImageProps {
  path: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Imagens privadas (ex: foto que o turista tirou na visita) exigem o token
 * de autenticacao no cabecalho — um <img src> comum nao consegue enviar
 * esse header, entao aqui buscamos o arquivo via fetch e exibimos como
 * blob-url.
 */
export function AuthedImage({ path, alt = "", className, style }: AuthedImageProps) {
  const { token } = useAuth();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      const response = await fetch(apiUrl(path), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok || cancelled) return;
      const blob = await response.blob();
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, token]);

  if (!url) return null;
  return <img src={url} alt={alt} className={className} style={style} />;
}
