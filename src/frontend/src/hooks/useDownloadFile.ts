import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useDownloadFile() {
  const { actor } = useActor(createActor);
  // Track which file IDs are currently downloading
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const mutation = useMutation({
    mutationFn: async ({
      fileId,
      fileName,
    }: { fileId: bigint; fileName: string }) => {
      if (!actor) throw new Error("Not authenticated");

      const blob = await actor.downloadFile(fileId);
      if (!blob) throw new Error("File not found or access denied");

      const bytes = await blob.getBytes();
      const blobObj = new Blob([bytes]);
      const url = URL.createObjectURL(blobObj);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSettled: (_data, _error, variables) => {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.fileId.toString());
        return next;
      });
    },
  });

  const download = (args: { fileId: bigint; fileName: string }) => {
    const id = args.fileId.toString();
    if (downloadingIds.has(id)) return; // prevent double-trigger
    setDownloadingIds((prev) => new Set(prev).add(id));
    toast(`Downloading "${args.fileName}"…`, {
      description: "Your file will be ready shortly.",
      duration: 4000,
    });
    mutation.mutate(args, {
      onError: (err) => {
        toast.error("Download failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      },
    });
  };

  return {
    download,
    isDownloading: (fileId: bigint) => downloadingIds.has(fileId.toString()),
    isPending: mutation.isPending,
  };
}
