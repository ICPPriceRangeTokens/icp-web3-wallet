import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

export function useUploadFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      folderId,
      onProgress,
    }: {
      file: File;
      folderId?: bigint | null;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not available");

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let blob = ExternalBlob.fromBytes(bytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }

      // Pass real file byte count so the backend stores accurate storage usage.
      const result = await actor.uploadFile(
        file.name,
        file.type || "application/octet-stream",
        blob,
        folderId ?? null,
        BigInt(file.size),
      );

      if (result === null) {
        throw new Error("Upload failed: server returned null");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["filesInFolder"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (error: Error) => {
      // Storage limit errors are detected by the caller
      console.error("Upload error:", error.message);
    },
  });
}

export function isStorageFullError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.toLowerCase().includes("storage limit exceeded") ||
    message.toLowerCase().includes("storage limit") ||
    message.toLowerCase().includes("quota") ||
    message.toLowerCase().includes("storage full")
  );
}
