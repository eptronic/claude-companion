
import { useState } from "react";
import { MessageSquare, File, Folder, Search } from "lucide-react";
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

    if (!inputMessage.trim()) {
      return;
    }

    setIsLoading(true);

    const newMessage = { role: "user", content: inputMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-claude', {
        body: {
          messages: updatedMessages
        },
      });

      if (error) throw error;

      if (data.content) {
        setMessages([...updatedMessages, { role: "assistant", content: data.content }]);
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
    <div className="w-screen h-screen overflow-hidden">
      <SidebarProvider>
        <div className="h-full flex">
          <Sidebar className="border-r border-border">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton>
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

          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-4 mb-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-12"
                        : "bg-muted text-muted-foreground mr-12"
                    }`}
                  >
                    {getMessageContent(message.content)}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-2 bg-muted text-foreground border-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send"}
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
