import { useMutation } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useDownloadFile() {
  const { actor } = useActor();

  return useMutation({
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
  });
}
