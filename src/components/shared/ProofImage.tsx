import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

interface ProofImageProps {
  filePath: string;
  fileName: string;
}

export function ProofImage({ filePath, fileName }: ProofImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);

  useEffect(() => {
    const fetchUrl = async () => {
      const { data, error: err } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(filePath, 3600);
      if (err || !data?.signedUrl) {
        setError(true);
      } else {
        setUrl(data.signedUrl);
      }
      setLoading(false);
    };
    fetchUrl();
  }, [filePath]);

  if (loading) {
    return (
      <div className="h-40 w-full animate-pulse rounded bg-muted" />
    );
  }

  if (error || !url) {
    return (
      <div className="flex items-center gap-2 rounded bg-muted/50 p-3 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>Unable to load file</span>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="overflow-hidden rounded border bg-muted/30">
        <img
          src={url}
          alt={fileName}
          className="max-h-80 w-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  // PDF or other file — show download link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded border bg-muted/30 p-3 text-sm font-medium text-primary underline hover:bg-muted/50 transition-colors"
    >
      <FileText className="h-4 w-4" />
      {fileName}
    </a>
  );
}
