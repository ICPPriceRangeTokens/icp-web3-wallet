import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Check,
  ChevronRight,
  Download,
  Edit2,
  File,
  Folder,
  FolderOpen,
  FolderPlus,
  Home,
  Lock,
  ShieldOff,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import type { FileMetadata } from "../backend";
import UpgradePrompt from "../components/UpgradePrompt";
import { useCreateFolder } from "../hooks/useCreateFolder";
import { useDeleteFile } from "../hooks/useDeleteFile";
import { useDeleteFolder } from "../hooks/useDeleteFolder";
import { useDownloadFile } from "../hooks/useDownloadFile";
import { useGetSubscription } from "../hooks/useGetSubscription";
import { useListFiles } from "../hooks/useListFiles";
import { useListFilesInFolder } from "../hooks/useListFilesInFolder";
import { useListFolders } from "../hooks/useListFolders";
import { useRenameFolder } from "../hooks/useRenameFolder";
import { useUploadFile } from "../hooks/useUploadFile";
import { formatStorageSize } from "../utils/storage";

type SerializedFolder = {
  folderId: string;
  ownerPrincipal: string;
  folderName: string;
  createTime: string;
};

type SerializedFileMetadata = {
  fileId: string;
  ownerPrincipal: string;
  fileName: string;
  fileSize: string;
  contentType: string;
  uploadTime: string;
  folderId?: string;
};

interface FileManagerProps {
  onNavigateToPlans?: () => void;
}

function getFileTypeLabel(contentType: string): string {
  if (!contentType) return "";
  // Normalize: "audio/mpeg" → check full type first, then subtype
  const lower = contentType.toLowerCase();
  const fullMap: Record<string, string> = {
    "audio/mpeg": "MP3",
    "audio/mp3": "MP3",
    "audio/ogg": "OGG",
    "audio/wav": "WAV",
    "audio/flac": "FLAC",
    "audio/aac": "AAC",
    "video/mp4": "MP4",
    "video/webm": "WEBM",
    "video/ogg": "OGV",
    "video/quicktime": "MOV",
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "image/webp": "WEBP",
    "image/svg+xml": "SVG",
    "application/pdf": "PDF",
    "application/zip": "ZIP",
    "application/json": "JSON",
    "application/xml": "XML",
    "text/plain": "TXT",
    "text/csv": "CSV",
    "text/html": "HTML",
  };
  if (fullMap[lower]) return fullMap[lower];
  const sub = contentType.split("/")[1];
  if (!sub) return contentType.toUpperCase().slice(0, 4);
  const subMap: Record<string, string> = {
    jpeg: "JPG",
    jpg: "JPG",
    png: "PNG",
    gif: "GIF",
    pdf: "PDF",
    plain: "TXT",
    zip: "ZIP",
    mp4: "MP4",
    webm: "WEBM",
    mp3: "MP3",
    mpeg: "MPEG",
    json: "JSON",
    xml: "XML",
    csv: "CSV",
  };
  return subMap[sub.toLowerCase()] || sub.toUpperCase().slice(0, 4);
}

export default function FileManager({ onNavigateToPlans }: FileManagerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: subscription } = useGetSubscription();
  const hasActiveSubscription = subscription?.status === "active";
  const isRevoked = subscription?.status === "revoked";
  const hasAnySubscription = !!subscription;

  const { data: rootFiles = [], isLoading: filesLoading } = useListFiles();
  const { data: folders = [], isLoading: foldersLoading } = useListFolders();
  const { data: folderFiles = [] } = useListFilesInFolder(currentFolderId);

  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const downloadFile = useDownloadFile();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();

  const rootOnlyFiles: FileMetadata[] = (rootFiles as FileMetadata[]).filter(
    (f) => f.folderId === undefined || f.folderId === null,
  );

  const currentFolderFiles: SerializedFileMetadata[] =
    folderFiles as SerializedFileMetadata[];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!hasActiveSubscription) {
      if (isRevoked) {
        setUploadError(
          "Your subscription has been revoked. Uploads are suspended. Extend your subscription to upload files.",
        );
      } else {
        setUploadError(
          "Active subscription required to upload files. Please subscribe to a plan.",
        );
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Check available storage before uploading
    if (subscription) {
      const limit = BigInt(subscription.storageLimitBytes);
      const used = BigInt(subscription.usedStorageBytes);
      const available = limit > used ? limit - used : 0n;
      if (BigInt(file.size) > available) {
        setUploadError(
          `File too large — ${formatStorageSize(file.size)} needed but only ${formatStorageSize(available)} available.`,
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    setUploadError("");
    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadFile.mutateAsync({
        file,
        folderId: currentFolderId ? BigInt(currentFolderId) : null,
        onProgress: (pct: number) => setUploadProgress(pct),
      });
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 800);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("storage limit") ||
        msg.toLowerCase().includes("storage full") ||
        msg.toLowerCase().includes("quota")
      ) {
        setUploadError(
          "Storage full — upgrade your plan to upload more files.",
        );
      } else if (msg.toLowerCase().includes("revoked")) {
        setUploadError(
          "Your subscription has been revoked. Uploads are suspended.",
        );
      } else if (msg.toLowerCase().includes("subscription")) {
        setUploadError("Active subscription required to upload files.");
      } else {
        setUploadError(msg);
      }
      setIsUploading(false);
      setUploadProgress(0);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder.mutateAsync(newFolderName.trim());
      setNewFolderName("");
      setShowNewFolderInput(false);
    } catch {
      // handle silently
    }
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!renameFolderName.trim()) return;
    try {
      await renameFolder.mutateAsync({
        folderId,
        newName: renameFolderName.trim(),
      });
      setRenamingFolderId(null);
      setRenameFolderName("");
    } catch {
      // handle silently
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder.mutateAsync(folderId);
      if (currentFolderId === folderId) setCurrentFolderId(null);
    } catch {
      // handle silently
    }
  };

  const currentFolder = (folders as SerializedFolder[]).find(
    (f) => f.folderId === currentFolderId,
  );

  const navigateToPlans = onNavigateToPlans ?? (() => {});

  // Upload zone
  const renderUploadZone = () => {
    if (!hasAnySubscription) {
      return <UpgradePrompt onNavigateToPlans={navigateToPlans} />;
    }

    if (isRevoked) {
      return (
        <div className="premium-card rounded-2xl p-6 border border-dashed border-warning/20 opacity-60">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-warning/60" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-muted-foreground">
                Uploads Disabled
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Extend your subscription to upload files.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        className="premium-card rounded-2xl p-8 border-dashed border-primary/25 hover:border-primary/50 transition-all duration-200 cursor-pointer group w-full text-left"
        onClick={() => !isUploading && fileInputRef.current?.click()}
        data-ocid="files.dropzone"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border border-primary/30 group-hover:border-primary/55 transition-all duration-200"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.22), oklch(0.62 0.22 208 / 0.14))",
            }}
          >
            <Upload className="w-7 h-7 text-primary/70 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-base font-display font-bold text-foreground">
              {isUploading ? "Uploading..." : "Upload a file"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentFolder
                ? `Uploading to "${currentFolder.folderName}"`
                : "Click to upload to root folder"}
            </p>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs space-y-2">
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${uploadProgress}%`,
                    background:
                      "linear-gradient(to right, oklch(0.78 0.195 188), oklch(0.62 0.22 208))",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {uploadProgress}% complete
              </p>
            </div>
          )}

          {uploadError && (
            <div
              data-ocid="files.upload.error_state"
              className="flex items-start gap-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-left w-full max-w-xs animate-fade-in"
            >
              <ShieldOff className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{uploadError}</p>
            </div>
          )}

          {!isUploading && (
            <button
              type="button"
              data-ocid="files.upload_button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="btn-ghost-teal flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              Choose File
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page header + breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-teal flex items-center justify-center teal-glow">
            <FolderOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              data-ocid="files.home.button"
              onClick={() => setCurrentFolderId(null)}
              className={`font-display font-bold transition-colors ${
                !currentFolderId
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Files
            </button>
            {currentFolder && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-foreground font-display font-bold">
                  {currentFolder.folderName}
                </span>
              </>
            )}
          </div>
        </div>
        {currentFolderId && (
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className="btn-ghost-teal flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
          >
            <Home className="w-3.5 h-3.5" />
            Back to Root
          </button>
        )}
      </div>

      {/* Revoked banner */}
      {isRevoked && (
        <div className="premium-card rounded-2xl p-4 flex items-start gap-3 border-warning/30">
          <ShieldOff className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-display font-bold text-warning">
              Upload Access Suspended
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Subscription revoked. Download and delete of existing files still
              available.
            </p>
          </div>
          {onNavigateToPlans && (
            <button
              type="button"
              onClick={navigateToPlans}
              className="btn-teal shrink-0 px-3 py-1.5 rounded-xl text-xs"
            >
              Extend
            </button>
          )}
        </div>
      )}

      {/* Upload zone */}
      {renderUploadZone()}

      {/* Folders section — root only */}
      {!currentFolderId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="section-label">Folders</p>
            {hasActiveSubscription && (
              <button
                type="button"
                data-ocid="files.new_folder.button"
                onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                className="btn-ghost-teal flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                New Folder
              </button>
            )}
          </div>

          {showNewFolderInput && (
            <div className="flex gap-2 items-center animate-fade-in">
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                className="input-dark flex-1 px-3 py-2 text-sm"
                data-ocid="files.folder_name.input"
              />
              <button
                type="button"
                data-ocid="files.create_folder.button"
                onClick={handleCreateFolder}
                disabled={createFolder.isPending}
                className="btn-teal flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewFolderInput(false);
                  setNewFolderName("");
                }}
                className="btn-ghost-teal flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {foldersLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-4 h-20 shimmer"
                />
              ))}
            </div>
          ) : (folders as SerializedFolder[]).length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No folders yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(folders as SerializedFolder[]).map((folder, idx) => (
                <div
                  key={folder.folderId}
                  data-ocid={`files.folder.${idx + 1}`}
                  className="glass-card glass-card-hover rounded-2xl p-3 group cursor-pointer"
                >
                  {renamingFolderId === folder.folderId ? (
                    <div
                      className="flex gap-1.5 items-center"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="presentation"
                    >
                      <input
                        type="text"
                        value={renameFolderName}
                        onChange={(e) => setRenameFolderName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          handleRenameFolder(folder.folderId)
                        }
                        className="input-dark flex-1 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        className="btn-teal flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
                        onClick={() => handleRenameFolder(folder.folderId)}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost-teal flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
                        onClick={() => setRenamingFolderId(null)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        className="flex flex-col items-center gap-2 w-full"
                        onClick={() => setCurrentFolderId(folder.folderId)}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center border border-primary/28 group-hover:border-primary/50 transition-colors"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.22), oklch(0.62 0.22 208 / 0.14))",
                          }}
                        >
                          <Folder className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-foreground/80 text-center truncate w-full">
                          {folder.folderName}
                        </span>
                      </button>
                      <div
                        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="presentation"
                      >
                        {hasActiveSubscription && (
                          <button
                            type="button"
                            data-ocid={`files.folder.edit_button.${idx + 1}`}
                            className="btn-ghost-teal flex items-center justify-center w-6 h-6 rounded-lg"
                            onClick={() => {
                              setRenamingFolderId(folder.folderId);
                              setRenameFolderName(folder.folderName);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              data-ocid={`files.folder.delete_button.${idx + 1}`}
                              className="flex items-center justify-center w-6 h-6 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete "{folder.folderName}"? The folder must be
                                empty.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteFolder(folder.folderId)
                                }
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Files section */}
      <div className="space-y-3">
        <p className="section-label">
          {currentFolder ? `Files in "${currentFolder.folderName}"` : "Files"}
        </p>

        {filesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-xl h-14 shimmer" />
            ))}
          </div>
        ) : currentFolderId === null ? (
          rootOnlyFiles.length === 0 ? (
            <div
              data-ocid="files.empty_state"
              className="glass-card rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-primary/20"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.16), oklch(0.62 0.22 208 / 0.10))",
                }}
              >
                <File className="w-6 h-6 text-primary/50" />
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-foreground/70">
                  No files here yet
                </p>
                {!hasAnySubscription && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    Subscribe to upload files
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {rootOnlyFiles.map((file: FileMetadata, idx) => (
                <div
                  key={String(file.fileId)}
                  data-ocid={`files.file.${idx + 1}`}
                  className="glass-card glass-card-hover rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-primary/22"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.20), oklch(0.62 0.22 208 / 0.12))",
                      }}
                    >
                      <File className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {file.fileName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {formatStorageSize(file.fileSize)}
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            Number(file.uploadTime / 1_000_000n),
                          ).toLocaleDateString()}
                        </span>
                        {file.contentType && (
                          <span className="text-xs font-bold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/15">
                            {getFileTypeLabel(file.contentType)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      data-ocid={`files.file.download_button.${idx + 1}`}
                      className="btn-ghost-teal flex items-center justify-center w-8 h-8 rounded-lg"
                      onClick={() =>
                        downloadFile.mutate({
                          fileId: file.fileId,
                          fileName: file.fileName,
                        })
                      }
                      disabled={downloadFile.isPending}
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          data-ocid={`files.file.delete_button.${idx + 1}`}
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/15 text-destructive hover:bg-destructive/20 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{file.fileName}"?
                            This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteFile.mutate(file.fileId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : currentFolderFiles.length === 0 ? (
          <div
            data-ocid="files.folder_empty_state"
            className="glass-card rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border border-primary/20"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.16), oklch(0.62 0.22 208 / 0.10))",
              }}
            >
              <File className="w-6 h-6 text-primary/50" />
            </div>
            <p className="text-sm font-display font-semibold text-foreground/70">
              No files in this folder
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentFolderFiles.map((file: SerializedFileMetadata, idx) => (
              <div
                key={file.fileId}
                data-ocid={`files.file.${idx + 1}`}
                className="glass-card glass-card-hover rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-primary/22"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.78 0.195 188 / 0.20), oklch(0.62 0.22 208 / 0.12))",
                    }}
                  >
                    <File className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {file.fileName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {formatStorageSize(Number(BigInt(file.fileSize)))}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(
                          Number(BigInt(file.uploadTime)) / 1_000_000,
                        ).toLocaleDateString()}
                      </span>
                      {file.contentType && (
                        <span className="text-xs font-bold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/15">
                          {getFileTypeLabel(file.contentType)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-ocid={`files.file.download_button.${idx + 1}`}
                    className="btn-ghost-teal flex items-center justify-center w-8 h-8 rounded-lg"
                    onClick={() =>
                      downloadFile.mutate({
                        fileId: BigInt(file.fileId),
                        fileName: file.fileName,
                      })
                    }
                    disabled={downloadFile.isPending}
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        data-ocid={`files.file.delete_button.${idx + 1}`}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/15 text-destructive hover:bg-destructive/20 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete File</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{file.fileName}"?
                          This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteFile.mutate(BigInt(file.fileId))}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
