import { useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useDiscordAuth, OWNER_DISCORD_ID } from "@/hooks/use-discord-auth";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, ShieldCheck, Upload, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/NotFound";

const BUCKET = "officials";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Owner-only panel for managing who can access the page and what file gets
// served — lives right on the site so the owner never has to touch the
// Supabase dashboard directly.
const OwnerSettingsPanel = () => {
  const { toast } = useToast();
  const [roleIds, setRoleIds] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [savingRoles, setSavingRoles] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRoleIds = async () => {
    setLoadingRoles(true);
    const { data } = await supabase.from("site_settings").select("value").eq("key", "officials_role_ids").maybeSingle();
    setRoleIds(data?.value ?? "");
    setLoadingRoles(false);
  };

  const loadCurrentFile = async () => {
    const { data } = await supabase.storage.from(BUCKET).list("", { limit: 1, sortBy: { column: "created_at", order: "desc" } });
    setCurrentFile(data?.[0]?.name ?? null);
  };

  useEffect(() => {
    loadRoleIds();
    loadCurrentFile();
  }, []);

  const saveRoleIds = async () => {
    setSavingRoles(true);
    const { error } = await supabase.from("site_settings").update({ value: roleIds.trim() }).eq("key", "officials_role_ids");
    setSavingRoles(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Role IDs saved" });
  };

  const [uploadPct, setUploadPct] = useState<number | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadPct(0);
    const previousFile = currentFile;

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setUploading(false);
      toast({ title: "Upload failed", description: "Your session expired — log in again.", variant: "destructive" });
      return;
    }

    // Resumable (chunked) upload so a 250MB+ file reports real progress
    // instead of the page just sitting there looking frozen — a plain
    // one-shot upload call can't report anything until it's fully done.
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: BUCKET,
        objectName: file.name,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024, // Supabase requires exactly 6MB chunks
      onError: (err) => {
        setUploading(false);
        setUploadPct(null);
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        setUploadPct(Math.round((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: async () => {
        // Keep only one file in the bucket — remove whatever was there
        // before, if it had a different name than the one just uploaded.
        if (previousFile && previousFile !== file.name) {
          await supabase.storage.from(BUCKET).remove([previousFile]);
        }
        setUploading(false);
        setUploadPct(null);
        toast({ title: "File uploaded", description: file.name });
        loadCurrentFile();
      },
    });

    const previousUploads = await upload.findPreviousUploads();
    if (previousUploads.length > 0) upload.resumeFromPreviousUpload(previousUploads[0]);
    upload.start();
  };

  const removeFile = async () => {
    if (!currentFile) return;
    if (!confirm(`Remove ${currentFile}? Nobody will be able to download anything until a new file is uploaded.`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove([currentFile]);
    if (error) {
      toast({ title: "Couldn't remove file", description: error.message, variant: "destructive" });
      return;
    }
    setCurrentFile(null);
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-secondary/30 bg-secondary/5 p-5 text-left space-y-5 mt-4">
      <h2 className="text-sm font-bold flex items-center gap-2">
        <Settings className="h-4 w-4 text-secondary" /> Officials Settings (owner only)
      </h2>

      <div className="space-y-2">
        <Label className="text-xs">Allowed Discord role IDs (comma-separated)</Label>
        <Input
          value={roleIds}
          onChange={(e) => setRoleIds(e.target.value)}
          placeholder="123456789012345678, 987654321098765432"
          disabled={loadingRoles}
          className="text-xs"
        />
        <Button size="sm" onClick={saveRoleIds} disabled={savingRoles || loadingRoles} className="h-7 text-xs">
          Save Role IDs
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Download file</Label>
        {currentFile ? (
          <div className="flex items-center justify-between gap-2 bg-background rounded-md px-3 py-2 text-xs">
            <span className="truncate">{currentFile}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={removeFile}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No file uploaded yet.</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
            e.target.value = "";
          }}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5 w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {currentFile ? "Replace file" : "Upload file"}
        </Button>
        {uploadPct !== null && (
          <div className="space-y-1">
            <Progress value={uploadPct} className="h-2" />
            <p className="text-[11px] text-muted-foreground text-right">{uploadPct}%</p>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">Uploading replaces the current file — there's only ever one.</p>
      </div>
    </div>
  );
};

// /officials — gated by a real Discord role check on the server. Not logged
// in or missing the role both render the same NotFound page (no "you're
// logged in but lack permission" hint — just a dead end either way).
export const Officials = () => {
  const { profile, loading: authLoading, login } = useDiscordAuth();
  const [checking, setChecking] = useState(false);
  const [denied, setDenied] = useState(false);
  const [downloadPct, setDownloadPct] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = profile?.discord_user_id === OWNER_DISCORD_ID;

  // Fetches the file bytes directly in one authenticated request — there is
  // no intermediate signed URL at any point, so nothing here could ever be
  // copy-pasted or reused by someone who isn't logged in with the right
  // role right now. Reads the stream manually (rather than just
  // response.blob()) purely so we can report real download progress for a
  // file this size instead of the page looking frozen.
  const downloadFile = async () => {
    setChecking(true);
    setError(null);
    setDownloadPct(0);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setChecking(false);
      setDownloadPct(null);
      setError("Your session expired — log in again.");
      return;
    }

    let res: Response;
    try {
      res = await fetch(`${SUPABASE_URL}/functions/v1/officials-access`, {
        headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
      });
    } catch {
      setChecking(false);
      setDownloadPct(null);
      setError("Couldn't reach the server — try again.");
      return;
    }

    if (!res.ok) {
      setChecking(false);
      setDownloadPct(null);
      const body = await res.json().catch(() => ({}) as any);
      if (body?.error === "not_authorized" || res.status === 403) {
        setDenied(true);
        return;
      }
      setError(body?.error ?? "Something went wrong checking access.");
      return;
    }

    const total = Number(res.headers.get("Content-Length") ?? 0);
    const cd = res.headers.get("Content-Disposition") ?? "";
    const nameMatch = cd.match(/filename="?([^"]+)"?/);
    const name = nameMatch?.[1] ?? "download";

    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (total > 0) setDownloadPct(Math.round((received / total) * 100));
        }
      }
    }

    const blob = new Blob(chunks as BlobPart[]);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);

    setChecking(false);
    setDownloadPct(null);
    setDownloaded(true);
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  // Not logged in at all, or the server said no — same dead-end page.
  // The owner always gets through to at least the settings panel, even if
  // their account doesn't happen to hold one of the configured roles.
  if (denied && !isOwner) return <NotFound />;

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Officials Access</h1>
        <p className="text-muted-foreground max-w-sm">Log in with the Discord account tied to your officials role to continue.</p>
        <Button onClick={login} className="gap-2">
          Log in with Discord
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 text-center">
      <ShieldCheck className="h-10 w-10 text-secondary" />
      <h1 className="text-2xl font-bold">Officials Access</h1>

      <p className="text-muted-foreground max-w-sm">
        Logged in as {profile.display_name}. {downloaded ? "Download complete." : "Checking your access unlocks the download."}
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!denied && !downloaded && (
        <div className="w-full max-w-xs space-y-2">
          <Button onClick={downloadFile} disabled={checking} className="gap-2 w-full">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {checking ? "Downloading…" : "Check Access & Download"}
          </Button>
          {downloadPct !== null && (
            <div className="space-y-1">
              <Progress value={downloadPct} className="h-2" />
              <p className="text-[11px] text-muted-foreground text-right">{downloadPct}%</p>
            </div>
          )}
        </div>
      )}
      {downloaded && (
        <Button variant="outline" onClick={downloadFile} className="gap-2">
          <Download className="h-4 w-4" /> Download Again
        </Button>
      )}
      {denied && isOwner && (
        <p className="text-xs text-muted-foreground">Your account isn't in the allowed roles list, so the download itself is locked for you too — but you can still manage settings below.</p>
      )}

      {isOwner && <OwnerSettingsPanel />}
    </div>
  );
};

export default Officials;
