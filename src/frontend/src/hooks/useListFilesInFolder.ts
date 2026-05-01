import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export interface SerializedFileMetadata {
  fileId: string;
  ownerPrincipal: string;
  fileName: string;
  fileSize: string;
  contentType: string;
  uploadTime: string;
  folderId?: string;
}

export function useListFilesInFolder(folderId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<SerializedFileMetadata[]>({
    queryKey: ["filesInFolder", folderId],
    queryFn: async () => {
      if (!actor || !folderId) return [];
      const files = await actor.listFilesInFolder(BigInt(folderId));
      return files.map((f) => ({
        fileId: f.fileId.toString(),
        ownerPrincipal: f.ownerPrincipal.toString(),
        fileName: f.fileName,
        fileSize: f.fileSize.toString(),
        contentType: f.contentType,
        uploadTime: f.uploadTime.toString(),
        folderId: f.folderId?.toString(),
      }));
    },
    enabled: !!actor && !isFetching && !!folderId,
  });
}
