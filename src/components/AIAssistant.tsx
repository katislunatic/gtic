import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ImagePlus, Mic, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type Message = { 
  role: "user" | "assistant"; 
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

type ChatMode = "text" | "voice-to-text" | "full-voice";

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>("text");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const streamChat = async (userMessage: string, imageUrl?: string | null): Promise<string> => {
    const messageContent = imageUrl
      ? [
          { type: "text", text: userMessage },
          { type: "image_url", image_url: { url: imageUrl } },
        ]
      : userMessage;

    const newMessages = [...messages, { role: "user" as const, content: messageContent }];
    setMessages(newMessages);
    setInput("");
    setUploadedImage(null);
    setIsLoading(true);

    let assistantContent = "";
    const addAssistantMessage = (chunk: string) => {
      assistantContent += chunk;
      setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
    };

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gtic-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) addAssistantMessage(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) addAssistantMessage(content);
          } catch {
            /* ignore */
          }
        }
      }

      return assistantContent;
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
      return "";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input, uploadedImage);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to convert audio');
        }

        const { data, error } = await supabase.functions.invoke('speech-to-text', {
          body: { audio: base64Audio }
        });

        if (error) {
          const errorMsg = error.message || 'Unknown error';
          if (errorMsg.includes('quota') || errorMsg.includes('insufficient_quota')) {
            toast({
              title: "OpenAI API Quota Exceeded",
              description: "Please add credits to your OpenAI account to use voice features.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Speech Recognition Error",
              description: "Failed to transcribe audio. Please try again.",
              variant: "destructive",
            });
          }
          throw error;
        }

        if (!data?.text) {
          throw new Error('No transcription received');
        }

        const transcribedText = data.text;
        
        if (chatMode === "voice-to-text") {
          await streamChat(transcribedText);
        } else if (chatMode === "full-voice") {
          const response = await streamChat(transcribedText);
          if (response) {
            await speakText(response);
          }
        }
      };
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'alloy' }
      });

      if (error) {
        const errorMsg = error.message || 'Unknown error';
        if (errorMsg.includes('quota') || errorMsg.includes('insufficient_quota')) {
          toast({
            title: "OpenAI API Quota Exceeded",
            description: "Please add credits to your OpenAI account to use voice features.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Text-to-Speech Error",
            description: "Failed to generate audio response.",
            variant: "destructive",
          });
        }
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        toast({
          title: "Audio Playback Error",
          description: "Failed to play audio response.",
          variant: "destructive",
        });
      };
      await audio.play();
    } catch (error) {
      console.error('Error speaking text:', error);
      setIsSpeaking(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hey there! 👋 I'm the GTIC Assistant. Need help finding something or have questions about the league?",
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={handleOpen}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 h-14 w-14 rounded-full shadow-lg glow-primary hover:scale-110 transition-transform"
        size="icon"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 w-96 h-[600px] flex flex-col bg-background border-2 border-primary/20 rounded-2xl shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/10 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">GTIC Assistant</h3>
              <div className="flex gap-1 ml-2">
                <Button
                  variant={chatMode === "text" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChatMode("text")}
                  className="h-6 px-2 text-xs"
                >
                  Text
                </Button>
                <Button
                  variant={chatMode === "voice-to-text" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChatMode("voice-to-text")}
                  className="h-6 px-2 text-xs"
                >
                  <Mic className="h-3 w-3" />
                </Button>
                <Button
                  variant={chatMode === "full-voice" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setChatMode("full-voice")}
                  className="h-6 px-2 text-xs"
                >
                  <Phone className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 hover:bg-primary/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {typeof msg.content === "string" ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-2">
                        {msg.content.map((item, i) => (
                          item.type === "text" ? (
                            <p key={i} className="text-sm whitespace-pre-wrap">{item.text}</p>
                          ) : item.type === "image_url" ? (
                            <img key={i} src={item.image_url?.url} alt="Uploaded" className="rounded-lg max-w-full" />
                          ) : null
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border space-y-2">
            {chatMode === "text" ? (
              <>
                {uploadedImage && (
                  <div className="relative inline-block">
                    <img src={uploadedImage} alt="Upload preview" className="h-20 rounded-lg" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => setUploadedImage(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about GTIC..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 items-center">
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isSpeaking}
                  className="w-full"
                >
                  {isRecording ? (
                    <>
                      <PhoneOff className="h-5 w-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      {chatMode === "voice-to-text" ? <Mic className="h-5 w-5 mr-2" /> : <Phone className="h-5 w-5 mr-2" />}
                      {chatMode === "voice-to-text" ? "Tap to Speak" : "Start Voice Chat"}
                    </>
                  )}
                </Button>
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-sm text-muted-foreground">
                      Listening...
                    </p>
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground">
                      AI is speaking...
                    </p>
                  </div>
                )}
                {isLoading && !isRecording && !isSpeaking && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Processing...
                    </p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
};
