
import { useState } from "react";
import { MessageSquare, File, Folder, Search, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

type MessageContent = {
  type?: string;
  text?: string;
} | string;

interface Message {
  role: string;
  content: MessageContent;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    setIsLoading(true);

    const newMessage = { role: "user", content: trimmedMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: {
          messages: updatedMessages
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.content) {
        setMessages([...updatedMessages, { role: "assistant", content: data.content }]);
      } else {
        throw new Error('No content in response');
      }
    } catch (error) {
      console.error('Error calling Claude:', error);
      toast({
        title: "Error",
        description: "Failed to get a response from Claude. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageContent = (content: MessageContent): string => {
    if (typeof content === 'string') {
      return content;
    }
    return content.text || '';
  };

  const sidebarItems = [
    { title: "Chat", icon: MessageSquare },
    { title: "Files", icon: File },
    { title: "Projects", icon: Folder },
    { title: "Search", icon: Search },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
      <SidebarProvider>
        <div className="h-full flex">
          <Sidebar className="border-r border-border bg-card">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="text-muted-foreground">Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton className="hover:bg-muted">
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 flex flex-col">
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary/90 text-primary-foreground"
                            : "bg-card text-card-foreground border border-border"
                        }`}
                      >
                        {getMessageContent(message.content)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-3 bg-card text-foreground border-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/70"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:hover:bg-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Sending..."
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Index;
