import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Footer } from "@/components/Footer";
import { ArrowLeft, CheckCircle2, Loader2, Paperclip, TriangleAlert, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDiscordAuth } from "@/hooks/use-discord-auth";

const MAX_FILES = 5;
const MAX_FILE_MB = 8;
const POST_LOGIN_KEY = "gtec-post-login";

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;

export const Appeal = () => {
  const { profile, loading: authLoading, login } = useDiscordAuth();

  const [punishmentId, setPunishmentId] = useState("");
  const [statement, setStatement] = useState("");
  const [promise, setPromise] = useState("");
  const [extra, setExtra] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleLogin = async () => {
    // DiscordCallback sends people back here after login instead of the homepage.
    sessionStorage.setItem(POST_LOGIN_KEY, "/appeal");
    try {
      await login();
    } catch (e) {
      sessionStorage.removeItem(POST_LOGIN_KEY);
      setError((e as Error).message);
    }
  };

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files];
    for (const f of Array.from(picked)) {
      if (next.length >= MAX_FILES) break;
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`"${f.name}" is over ${MAX_FILE_MB}MB, so it wasn't added.`);
        continue;
      }
      if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!punishmentId.trim()) return setError("Please enter your Punishment ID. You can find it with /mypunishments in Discord.");
    if (!statement.trim()) return setError("Please write your appeal statement.");
    if (!promise.trim()) return setError("Please fill in what you will do differently.");
    if (!agreed) return setError("You must confirm that your information is truthful before submitting.");

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("punishmentId", punishmentId.trim().toUpperCase());
      body.append("statement", statement.trim());
      body.append("promise", promise.trim());
      body.append("extra", extra.trim());
      files.forEach((f) => body.append("evidence", f));

      const { data, error: fnError } = await supabase.functions.invoke("appeal-submit", { body });

      if (fnError) {
        // Non-2xx responses carry our JSON error message on the error's context.
        let message = fnError.message;
        const ctx = (fnError as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const parsed = await ctx.json();
            if (parsed?.error) message = parsed.error;
          } catch {
            /* keep the generic message */
          }
        }
        throw new Error(message);
      }
      if ((data as { error?: string } | null)?.error) throw new Error((data as { error: string }).error);

      setDone(true);
    } catch (err) {
      setError((err as Error).message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 md:pt-36 pb-16">
      <div className="container mx-auto px-4 max-w-xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-8">
          <ArrowLeft className="h-4 w-4 mr-1" /> Home
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="hero-text">Punishment Appeal</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Log in with Discord so staff can identify your account. Appeals are reviewed within 48 hours and
            you'll get a response by DM. You can also run <code>/appeal</code> in Discord to appeal from your DMs.
          </p>
        </div>

        {authLoading ? (
          <Card className="team-card">
            <CardContent className="p-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : done ? (
          <Card className="team-card">
            <CardContent className="p-8 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold">Appeal Submitted</h2>
              <p className="text-sm text-muted-foreground">
                Your appeal was sent to the staff team. You'll get a response by Discord DM within 48 hours.
                Please don't submit another appeal or DM staff about this one.
              </p>
            </CardContent>
          </Card>
        ) : !profile ? (
          <Card className="team-card">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                To submit an appeal, we need to verify your Discord identity. We only read your username and ID —
                no messages or server access.
              </p>
              {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}
              <Button onClick={handleLogin}>Log in with Discord</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="team-card">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                <span className="text-sm text-muted-foreground">
                  Appealing as <span className="text-foreground font-medium">{profile.display_name}</span>
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm space-y-1">
                  <p className="font-semibold text-yellow-500 flex items-center gap-2">
                    <TriangleAlert className="h-4 w-4" /> Before you submit
                  </p>
                  <ul className="text-muted-foreground list-disc pl-5 space-y-0.5">
                    <li>Be honest and provide as much detail as possible.</li>
                    <li>Do not DM staff about your appeal — it will be ignored.</li>
                    <li>False information or spam appeals may result in a denial.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="punishment-id">Punishment ID *</Label>
                  <Input
                    id="punishment-id"
                    value={punishmentId}
                    onChange={(e) => setPunishmentId(e.target.value)}
                    placeholder="e.g. M3X7K2"
                    maxLength={20}
                    className="uppercase"
                  />
                  <p className="text-xs text-muted-foreground">Find this with /mypunishments in Discord.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="statement">Your Appeal Statement *</Label>
                  <Textarea
                    id="statement"
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Explain why you believe your punishment was unfair or why it should be lifted."
                    maxLength={1500}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground text-right">{statement.length} / 1500</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="promise">What will you do differently? *</Label>
                  <Textarea
                    id="promise"
                    value={promise}
                    onChange={(e) => setPromise(e.target.value)}
                    placeholder="Tell us how you'll follow the rules going forward."
                    maxLength={600}
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="extra">Anything else to add? (optional)</Label>
                  <Textarea
                    id="extra"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="Any other context you'd like to share."
                    maxLength={600}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Evidence (optional)</Label>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={files.length >= MAX_FILES}
                    className="w-full rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <Paperclip className="h-5 w-5 mx-auto mb-1" />
                    Click to upload screenshots, videos or PDFs
                    <span className="block text-xs mt-0.5">Up to {MAX_FILES} files, {MAX_FILE_MB}MB each</span>
                  </button>
                  {files.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="truncate">{f.name}</span>
                      <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
                        {formatSize(f.size)}
                        <button
                          type="button"
                          aria-label={`Remove ${f.name}`}
                          onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                          className="hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-3 rounded-lg border p-4 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                  <span>
                    I confirm that all information in this appeal is truthful and accurate. I understand that
                    false or misleading information may result in my appeal being denied and further action
                    being taken against my account.
                  </span>
                </label>

                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Appeal
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};
